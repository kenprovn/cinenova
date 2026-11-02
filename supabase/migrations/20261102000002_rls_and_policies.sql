-- ==============================================================================
-- CINENOVA – Phase 2 Row Level Security (RLS) & Permissions
-- Migration: 20261102000002_rls_and_policies.sql
-- ==============================================================================

-- 1. Explicit Schema and Table Grants (Required when auto-expose is OFF)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.movies TO anon, authenticated;
GRANT SELECT ON public.cinemas TO anon, authenticated;
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT SELECT ON public.seats TO anon, authenticated;
GRANT SELECT ON public.showtimes TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO authenticated, anon;
GRANT SELECT, INSERT ON public.booking_seats TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_holds TO authenticated, anon;
GRANT SELECT ON public.tickets TO authenticated;

-- Admin execution grant for full control via authenticated client
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Security Definer Helper Function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 3. Enable RLS on All Public Tables
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
-- 4. POLICIES: PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    );

-- ==============================================================================
-- 5. POLICIES: MOVIES
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
-- 6. POLICIES: CINEMAS, ROOMS, SEATS
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
-- 7. POLICIES: SHOWTIMES
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
-- 8. POLICIES: BOOKINGS & TICKETS
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own bookings or admin view all" ON public.bookings;
CREATE POLICY "Users can view own bookings or admin view all"
    ON public.bookings FOR SELECT
    TO authenticated, anon
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
CREATE POLICY "Customers create bookings"
    ON public.bookings FOR INSERT
    TO authenticated, anon
    WITH CHECK (auth.uid() IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own booking seats" ON public.booking_seats;
CREATE POLICY "Users view own booking seats"
    ON public.booking_seats FOR SELECT
    TO authenticated, anon
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users view own tickets" ON public.tickets;
CREATE POLICY "Users view own tickets"
    ON public.tickets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.is_admin())
        )
    );
