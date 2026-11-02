-- ==============================================================================
-- CINENOVA – Phase 2 Row Level Security (RLS) & Permissions
-- Migration: 20261102000002_rls_and_policies.sql
-- ==============================================================================

-- 1. Explicit Schema and Least-Privilege Grants
-- In Supabase, when "Automatically expose new tables" is OFF, API roles require
-- explicit table grants. In accordance with least-privilege security:
-- - FRONTEND ROLES (anon, authenticated) ARE NEVER GRANTED TRUNCATE, REFERENCES, OR TRIGGER.
-- - 'anon' is granted strictly SELECT on public catalog tables and limited access to seat_holds.
-- - 'authenticated' is granted explicit DML (SELECT, INSERT, UPDATE, DELETE) only where necessary.
-- - Destructive and administrative mutations are guarded at the row level by RLS policies.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Catalog tables: Public read-only for anonymous and authenticated users
GRANT SELECT ON public.movies TO anon, authenticated;
GRANT SELECT ON public.cinemas TO anon, authenticated;
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT SELECT ON public.seats TO anon, authenticated;
GRANT SELECT ON public.showtimes TO anon, authenticated;

-- Catalog tables: Administrative DML granted ONLY to authenticated role (RLS restricts to Admins)
GRANT INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cinemas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seats TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.showtimes TO authenticated;

-- User profile table: Authenticated users can view profiles and update their own
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Seat holds table: Temporary reservation before booking confirmation
-- In Phase 2: Direct access and public reading are locked to prevent user_id leakage and hold griefing.
-- Realtime seat holds will be handled via secure RPC/view in Phase 3.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_holds TO authenticated;

-- Transactional tables: Bookings and seats
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_seats TO authenticated;

-- Sensitive financial & issuance tables: Restricted write access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;

-- Sequence access: Least privilege (USAGE and SELECT, never ALL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Backend Service Role: Full administrative access for server-side scripts / webhooks
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- NOTE ON DEFAULT PRIVILEGES:
-- We deliberately DO NOT execute ALTER DEFAULT PRIVILEGES to grant permissions on future tables.
-- Every future table must be granted explicitly with least privilege to prevent unintended data exposure.

-- ==============================================================================
-- 2. Security Definer Helper Function: is_admin()
-- Hardened with SET search_path = '' and fully qualified identifiers.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ==============================================================================
-- 3. Hardened Trigger: Prevent Customer Privilege Escalation to Admin
-- Prevents users from updating their own or any other user's role via frontend APIs.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_is_caller_admin BOOLEAN;
BEGIN
    -- If role is not being altered, allow operation
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
        RETURN NEW;
    END IF;

    v_caller_id := (SELECT auth.uid());

    -- If executed from direct SQL Editor/service_role migration (auth.uid() IS NULL), allow
    IF v_caller_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Query caller's actual role safely
    SELECT (p.role = 'admin') INTO v_is_caller_admin
    FROM public.profiles p
    WHERE p.id = v_caller_id;

    IF v_is_caller_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Từ chối truy cập: Chỉ quản trị viên mới có quyền cập nhật vai trò (role) của tài khoản.';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_role_escalation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- ==============================================================================
-- 4. Enable Row Level Security (RLS) on All Public Tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. POLICIES: PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin())
    WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        (id = (SELECT auth.uid()) AND role = 'customer')
        OR public.is_admin()
    );

-- ==============================================================================
-- 6. POLICIES: MOVIES
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view active movies" ON public.movies;
CREATE POLICY "Public can view active movies"
    ON public.movies FOR SELECT
    TO anon, authenticated
    USING (status != 'hidden' OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to movies" ON public.movies;
CREATE POLICY "Admins have full access to movies"
    ON public.movies FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. POLICIES: CINEMAS, ROOMS, SEATS
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view active cinemas" ON public.cinemas;
CREATE POLICY "Public can view active cinemas"
    ON public.cinemas FOR SELECT
    TO anon, authenticated
    USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage cinemas" ON public.cinemas;
CREATE POLICY "Admins manage cinemas"
    ON public.cinemas FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view active rooms" ON public.rooms;
CREATE POLICY "Public can view active rooms"
    ON public.rooms FOR SELECT
    TO anon, authenticated
    USING (status != 'inactive' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage rooms" ON public.rooms;
CREATE POLICY "Admins manage rooms"
    ON public.rooms FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view active seats" ON public.seats;
CREATE POLICY "Public can view active seats"
    ON public.seats FOR SELECT
    TO anon, authenticated
    USING (status != 'disabled' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage seats" ON public.seats;
CREATE POLICY "Admins manage seats"
    ON public.seats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 8. POLICIES: SHOWTIMES
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view scheduled showtimes" ON public.showtimes;
CREATE POLICY "Public can view scheduled showtimes"
    ON public.showtimes FOR SELECT
    TO anon, authenticated
    USING (status != 'cancelled' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage showtimes" ON public.showtimes;
CREATE POLICY "Admins manage showtimes"
    ON public.showtimes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 9. POLICIES: SEAT HOLDS
-- In Phase 2: Direct client access to seat_holds is completely locked to prevent
-- leaking user_id and to prevent hold griefing / race conditions.
-- Only Admins can manage seat_holds. Public Realtime seat holding will be handled
-- via atomic RPC and sanitized view in Phase 3.
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view active seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Users can create seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Authenticated users can create seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Users can release own seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Authenticated users can release own seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Admins manage seat holds" ON public.seat_holds;
CREATE POLICY "Admins manage seat holds"
    ON public.seat_holds FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 10. POLICIES: BOOKINGS & BOOKING SEATS
-- In Phase 2: Customers can ONLY SELECT their own bookings and booked seats.
-- Direct table INSERT, UPDATE, and DELETE from customers are locked to prevent
-- tampering with prices, status, or showtime seats.
-- Atomic booking creation and payment processing will be executed via trusted RPC in Phase 3.
-- ==============================================================================
-- Explicitly drop any legacy or permissive write policies
DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers update own pending bookings or admin manage" ON public.bookings;
DROP POLICY IF EXISTS "Admins delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings or admin view all" ON public.bookings;

CREATE POLICY "Users can view own bookings or admin view all"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "Admins manage bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Explicitly drop any legacy or permissive write policies on booking_seats
DROP POLICY IF EXISTS "Customers insert booking seats for own booking" ON public.booking_seats;
DROP POLICY IF EXISTS "Admins manage booking seats" ON public.booking_seats;
DROP POLICY IF EXISTS "Users view own booking seats" ON public.booking_seats;

CREATE POLICY "Users view own booking seats"
    ON public.booking_seats FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id 
              AND (b.user_id = (SELECT auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "Admins manage booking seats"
    ON public.booking_seats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 11. POLICIES: PAYMENTS & TICKETS
-- Payments and tickets can strictly only be viewed by the booking owner or an admin.
-- Creating payments, confirming status, and issuing valid tickets are reserved exclusively
-- for Admins (and Phase 3 trusted server/RPC transactions). Direct customer write is blocked.
-- ==============================================================================
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id 
              AND (b.user_id = (SELECT auth.uid()) OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Customers record initial payment for own booking" ON public.payments;

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users view own tickets" ON public.tickets;
CREATE POLICY "Users view own tickets"
    ON public.tickets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id 
              AND (b.user_id = (SELECT auth.uid()) OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Admins manage tickets" ON public.tickets;
CREATE POLICY "Admins manage tickets"
    ON public.tickets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
