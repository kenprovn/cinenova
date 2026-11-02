-- ==============================================================================
-- CINENOVA – Phase 3 Concurrency & Seat Holds Migration (Hardened)
-- Migration: 20261102000003_seat_holds_and_concurrency.sql
-- ==============================================================================

-- 0. Enable pgcrypto safely if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Anti-Double Booking Table: showtime_seats
-- Strictly guarantees at database storage engine level with PRIMARY KEY (showtime_id, seat_id)
-- that no two bookings can EVER confirm or claim the same seat in the same showtime.
-- Note: ON DELETE RESTRICT on booking_id prevents accidental cascading deletion of confirmed sales.
CREATE TABLE IF NOT EXISTS public.showtime_seats (
    showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (showtime_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_showtime_seats_booking ON public.showtime_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_showtime_seats_seat ON public.showtime_seats(seat_id);

-- Enable RLS on showtime_seats
ALTER TABLE public.showtime_seats ENABLE ROW LEVEL SECURITY;

-- PRIVACY GUARD: Revoke direct public/customer SELECT on showtime_seats to protect booking_id.
-- Customers and public NEVER read showtime_seats directly; they query seat occupancy exclusively
-- via the sanitized RPC get_showtime_seat_statuses(), which returns only non-sensitive booleans.
REVOKE ALL ON public.showtime_seats FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showtime_seats TO authenticated;

DROP POLICY IF EXISTS "Public can view showtime seats" ON public.showtime_seats;
DROP POLICY IF EXISTS "Admins manage showtime seats" ON public.showtime_seats;

CREATE POLICY "Admins manage showtime seats"
    ON public.showtime_seats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 1b. PRIVACY GUARD & LEAST PRIVILEGE: seat_holds
-- Prevent user_id exposure and direct hold tampering.
-- Customers and anon NEVER read or write seat_holds directly.
-- Public querying of seat availability is done strictly through get_showtime_seat_statuses(UUID).
-- Seat holds are acquired/released exclusively via acquire_seat_hold and release_seat_hold RPCs.
REVOKE ALL ON public.seat_holds FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_holds TO authenticated;

-- Explicitly drop any legacy or Phase 2 public/customer policies on seat_holds
DROP POLICY IF EXISTS "Public can view active seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Public can view active holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Users can view active seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Users can create seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Authenticated users can create seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Users can release own seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Authenticated users can release own seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Admins manage seat holds" ON public.seat_holds;

-- Only Admins have direct SELECT/INSERT/UPDATE/DELETE access to seat_holds table
CREATE POLICY "Admins manage seat holds"
    ON public.seat_holds FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Add Tables to Supabase Realtime Publication if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_holds;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.showtime_seats;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- 3. Sanitized Showtime Seat Status Query RPC
-- Security: Does NOT expose user_id, booking_id, phone, email, or session tokens of other patrons.
-- Both anon and authenticated roles can call this to see current seat availability in real time.
CREATE OR REPLACE FUNCTION public.get_showtime_seat_statuses(p_showtime_id UUID)
RETURNS TABLE (
    seat_id UUID,
    row_label TEXT,
    seat_number INTEGER,
    seat_type TEXT,
    price NUMERIC(12,2),
    status TEXT,
    is_booked BOOLEAN,
    is_held BOOLEAN,
    is_held_by_me BOOLEAN,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_room_id UUID;
    v_price_regular NUMERIC(12,2);
    v_price_vip NUMERIC(12,2);
    v_caller_id UUID;
BEGIN
    v_caller_id := (SELECT auth.uid());

    -- Fetch showtime room and pricing
    SELECT s.room_id, s.price_regular, s.price_vip
    INTO v_room_id, v_price_regular, v_price_vip
    FROM public.showtimes s
    WHERE s.id = p_showtime_id;

    IF v_room_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        st.id AS seat_id,
        st.row_label,
        st.seat_number,
        st.seat_type,
        CASE st.seat_type
            WHEN 'vip' THEN v_price_vip
            WHEN 'couple' THEN ROUND(v_price_vip * 1.8, -3)
            ELSE v_price_regular
        END AS price,
        CASE
            WHEN st.status != 'active' THEN 'disabled'
            WHEN ss.seat_id IS NOT NULL THEN 'booked'
            WHEN sh.seat_id IS NOT NULL AND sh.expires_at > pg_catalog.clock_timestamp() THEN
                CASE WHEN v_caller_id IS NOT NULL AND sh.user_id = v_caller_id THEN 'selected' ELSE 'held' END
            ELSE 'available'
        END AS status,
        (ss.seat_id IS NOT NULL) AS is_booked,
        (sh.seat_id IS NOT NULL AND sh.expires_at > pg_catalog.clock_timestamp()) AS is_held,
        (v_caller_id IS NOT NULL AND sh.user_id = v_caller_id AND sh.expires_at > pg_catalog.clock_timestamp()) AS is_held_by_me,
        CASE
            WHEN v_caller_id IS NOT NULL AND sh.user_id = v_caller_id AND sh.expires_at > pg_catalog.clock_timestamp() THEN sh.expires_at
            ELSE NULL
        END AS expires_at
    FROM public.seats st
    LEFT JOIN public.showtime_seats ss
        ON ss.seat_id = st.id AND ss.showtime_id = p_showtime_id
    LEFT JOIN public.seat_holds sh
        ON sh.seat_id = st.id AND sh.showtime_id = p_showtime_id AND sh.expires_at > pg_catalog.clock_timestamp()
    WHERE st.room_id = v_room_id
    ORDER BY st.row_label ASC, st.seat_number ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_showtime_seat_statuses(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_showtime_seat_statuses(UUID) TO anon, authenticated;

-- 4. Atomic Seat Hold RPC: acquire_seat_hold (Race-Condition Free)
-- Guarantees:
-- 1. Sorts seat IDs deterministically in ascending order to prevent deadlocks.
-- 2. Uses conditional UPSERT with WHERE clause: strictly prevents overwriting unexpired holds of other users.
-- 3. Verifies post-condition: every requested seat MUST be verified as held by caller.
-- 4. If ANY seat cannot be acquired, the entire transaction raises an exception and rolls back.
CREATE OR REPLACE FUNCTION public.acquire_seat_hold(
    p_showtime_id UUID,
    p_seat_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_showtime_room_id UUID;
    v_showtime_status TEXT;
    v_showtime_starts_at TIMESTAMPTZ;
    v_sorted_seat_ids UUID[];
    v_invalid_seats_count INTEGER;
    v_already_booked_count INTEGER;
    v_verified_holds_count INTEGER;
    v_expires_at TIMESTAMPTZ;
    s_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Vui lòng đăng nhập để thực hiện chọn giữ ghế.';
    END IF;

    IF p_seat_ids IS NULL OR cardinality(p_seat_ids) = 0 THEN
        RAISE EXCEPTION 'Danh sách ghế không được để trống.';
    END IF;

    -- Validate no NULL elements in array
    IF EXISTS (SELECT 1 FROM unnest(p_seat_ids) AS s WHERE s IS NULL) THEN
        RAISE EXCEPTION 'Danh sách ghế chứa giá trị không hợp lệ.';
    END IF;

    -- Validate no duplicate elements in array
    IF cardinality(p_seat_ids) != (SELECT count(DISTINCT s) FROM unnest(p_seat_ids) AS s) THEN
        RAISE EXCEPTION 'Danh sách ghế bị trùng lặp vị trí.';
    END IF;

    IF cardinality(p_seat_ids) > 8 THEN
        RAISE EXCEPTION 'Mỗi lần đặt vé chỉ được giữ tối đa 8 ghế.';
    END IF;

    -- Sort seat IDs strictly in ascending order to prevent deadlocks under concurrent requests
    SELECT array_agg(id ORDER BY id ASC) INTO v_sorted_seat_ids
    FROM unnest(p_seat_ids) AS id;

    -- Verify showtime existence, status, and future timing
    SELECT s.room_id, s.status, s.starts_at
    INTO v_showtime_room_id, v_showtime_status, v_showtime_starts_at
    FROM public.showtimes s
    WHERE s.id = p_showtime_id;

    IF v_showtime_room_id IS NULL THEN
        RAISE EXCEPTION 'Suất chiếu không tồn tại.';
    END IF;

    IF v_showtime_status != 'scheduled' THEN
        RAISE EXCEPTION 'Suất chiếu không ở trạng thái sẵn sàng nhận đặt vé (Trạng thái: %).', v_showtime_status;
    END IF;

    IF v_showtime_starts_at <= pg_catalog.clock_timestamp() THEN
        RAISE EXCEPTION 'Suất chiếu đã bắt đầu hoặc đã qua thời gian mở bán vé.';
    END IF;

    -- Verify all requested seats belong to this showtime room and are active
    SELECT count(*) INTO v_invalid_seats_count
    FROM unnest(v_sorted_seat_ids) AS req_seat_id
    WHERE req_seat_id NOT IN (
        SELECT id FROM public.seats
        WHERE room_id = v_showtime_room_id AND status = 'active'
    );

    IF v_invalid_seats_count > 0 THEN
        RAISE EXCEPTION 'Một hoặc nhiều ghế được chọn không hợp lệ hoặc không thuộc phòng chiếu này.';
    END IF;

    -- Check if any seat is already booked in showtime_seats (fast preliminary check)
    SELECT count(*) INTO v_already_booked_count
    FROM public.showtime_seats
    WHERE showtime_id = p_showtime_id
      AND seat_id = ANY(v_sorted_seat_ids);

    IF v_already_booked_count > 0 THEN
        RAISE EXCEPTION 'Một hoặc nhiều ghế đã được xác nhận bán thành công cho khách hàng khác.';
    END IF;

    -- Hold duration: exactly 5 minutes from current wall-clock timestamp (clock_timestamp)
    v_expires_at := pg_catalog.clock_timestamp() + INTERVAL '5 minutes';

    -- Clean up any other seats previously held by this user for this showtime that are not in the new selection
    DELETE FROM public.seat_holds
    WHERE showtime_id = p_showtime_id
      AND user_id = v_user_id
      AND seat_id NOT IN (SELECT unnest(v_sorted_seat_ids));

    -- ATOMIC CONDITIONAL UPSERT (Deterministic lock order via v_sorted_seat_ids):
    -- Evaluates expires_at using clock_timestamp() so that lock-wait elapsed time is accurately accounted for.
    -- If a seat hold already exists for (showtime_id, seat_id), DO UPDATE is ONLY executed if:
    -- 1. The existing hold has EXPIRED (expires_at <= clock_timestamp()), OR
    -- 2. The existing hold belongs to the SAME caller (user_id = v_user_id).
    -- If the existing hold belongs to ANOTHER user and is STILL UNEXPIRED, the WHERE condition evaluates to FALSE,
    -- causing PostgreSQL to SKIP the update (no row is updated or inserted).
    FOREACH s_id IN ARRAY v_sorted_seat_ids LOOP
        INSERT INTO public.seat_holds (showtime_id, seat_id, user_id, expires_at, created_at)
        VALUES (p_showtime_id, s_id, v_user_id, v_expires_at, pg_catalog.clock_timestamp())
        ON CONFLICT (showtime_id, seat_id) DO UPDATE
            SET user_id = EXCLUDED.user_id,
                expires_at = EXCLUDED.expires_at,
                created_at = pg_catalog.clock_timestamp()
            WHERE public.seat_holds.expires_at <= pg_catalog.clock_timestamp()
               OR public.seat_holds.user_id = v_user_id;
    END LOOP;

    -- CRITICAL POST-LOCK CONCURRENCY CHECK:
    -- Re-check showtime_seats AFTER acquiring locks on seat_holds.
    -- This prevents a race condition where a concurrent confirm_demo_payment transaction
    -- committed sale of one of these seats while acquire_seat_hold was executing or waiting on locks.
    SELECT count(*) INTO v_already_booked_count
    FROM public.showtime_seats
    WHERE showtime_id = p_showtime_id
      AND seat_id = ANY(v_sorted_seat_ids);

    IF v_already_booked_count > 0 THEN
        RAISE EXCEPTION 'Một hoặc nhiều ghế đã được xác nhận bán thành công cho khách hàng khác trong lúc xử lý.';
    END IF;

    -- POST-CONDITION VERIFICATION:
    -- Verify that ALL requested seats are now successfully held by caller with the new expires_at.
    -- If any seat was held by another user and could not be updated, the verified count will not match,
    -- triggering RAISE EXCEPTION which automatically ROLLS BACK the entire transaction!
    SELECT count(*) INTO v_verified_holds_count
    FROM public.seat_holds
    WHERE showtime_id = p_showtime_id
      AND seat_id = ANY(v_sorted_seat_ids)
      AND user_id = v_user_id
      AND expires_at = v_expires_at;

    IF v_verified_holds_count != cardinality(v_sorted_seat_ids) THEN
        RAISE EXCEPTION 'Một hoặc nhiều ghế đang được giữ bởi khách hàng khác. Toàn bộ yêu cầu chọn ghế bị hủy bỏ.';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'expires_at', v_expires_at,
        'expires_in_seconds', 300,
        'held_seat_ids', v_sorted_seat_ids
    );
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_seat_hold(UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_seat_hold(UUID, UUID[]) TO authenticated;

-- 5. Release Seat Hold RPC: release_seat_hold
CREATE OR REPLACE FUNCTION public.release_seat_hold(
    p_showtime_id UUID,
    p_seat_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập');
    END IF;

    SELECT (role = 'admin') INTO v_is_admin
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_is_admin IS TRUE THEN
        DELETE FROM public.seat_holds
        WHERE showtime_id = p_showtime_id
          AND seat_id = ANY(p_seat_ids);
    ELSE
        DELETE FROM public.seat_holds
        WHERE showtime_id = p_showtime_id
          AND seat_id = ANY(p_seat_ids)
          AND user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.release_seat_hold(UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_seat_hold(UUID, UUID[]) TO authenticated;
