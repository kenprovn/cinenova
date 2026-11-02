-- ==============================================================================
-- CINENOVA – Phase 3 Booking Transactions, Demo Payments & QR Tickets (Hardened)
-- Migration: 20261102000004_payment_tickets_checkin.sql
-- ==============================================================================

-- 1. Helper function: is_staff_or_admin()
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
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
          AND role IN ('admin', 'staff')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_staff_or_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO anon, authenticated;

-- 2. Add idempotency_key to bookings table for retry / double-click protection
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_user_idempotency
    ON public.bookings (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- 3. Atomic Booking Transaction RPC: create_booking_transaction
-- Creates a pending booking with prices securely computed on the database server.
-- Enforces per-checkout session idempotency, valid unexpired seat holds, and anti-tampering.
-- Eliminates TOCTOU races with atomic EXCEPTION WHEN unique_violation handling.
-- Rejects requests with matching idempotency_key but mismatched payload.
CREATE OR REPLACE FUNCTION public.create_booking_transaction(
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_payment_method TEXT DEFAULT 'momo',
    p_idempotency_key TEXT DEFAULT NULL
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
    v_price_regular NUMERIC(12,2);
    v_price_vip NUMERIC(12,2);
    v_sorted_seat_ids UUID[];
    v_existing_seats UUID[];
    v_held_count INTEGER;
    v_calculated_total NUMERIC(12,2) := 0;
    v_booking_id UUID;
    v_booking_code TEXT;
    v_existing_booking RECORD;
    s_rec RECORD;
    v_seat_price NUMERIC(12,2);
    v_clean_idempotency TEXT;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Vui lòng đăng nhập để tiến hành đặt vé.';
    END IF;

    -- Mandatory idempotency_key enforcement for customer flow
    v_clean_idempotency := TRIM(p_idempotency_key);
    IF v_clean_idempotency IS NULL OR v_clean_idempotency = '' THEN
        RAISE EXCEPTION 'Khóa idempotency (idempotency_key) là bắt buộc cho giao dịch đặt vé.';
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
        RAISE EXCEPTION 'Mỗi lần đặt vé chỉ được tối đa 8 ghế.';
    END IF;

    -- Sort seat IDs strictly in ascending order to prevent deadlocks and enable payload comparison
    SELECT array_agg(id ORDER BY id ASC) INTO v_sorted_seat_ids
    FROM unnest(p_seat_ids) AS id;

    -- 1. FAST-PATH IDEMPOTENCY CHECK & PAYLOAD MISMATCH VALIDATION:
    -- If a booking already exists with this idempotency key for this caller, verify that payload matches.
    SELECT b.id, b.booking_code, b.total_amount, b.status, b.showtime_id
    INTO v_existing_booking
    FROM public.bookings b
    WHERE b.user_id = v_user_id
      AND b.idempotency_key = v_clean_idempotency;

    IF v_existing_booking.id IS NOT NULL THEN
        -- Verify payload consistency: showtime_id and seat_ids must match exactly
        SELECT array_agg(seat_id ORDER BY seat_id ASC)
        INTO v_existing_seats
        FROM public.booking_seats
        WHERE booking_id = v_existing_booking.id;

        IF v_existing_booking.showtime_id IS DISTINCT FROM p_showtime_id
           OR v_existing_seats IS DISTINCT FROM v_sorted_seat_ids THEN
            RAISE EXCEPTION 'Khóa idempotency đã được sử dụng với thông tin đặt vé khác.';
        END IF;

        IF v_existing_booking.status IN ('pending', 'confirmed') THEN
            RETURN jsonb_build_object(
                'success', true,
                'booking_id', v_existing_booking.id,
                'booking_code', v_existing_booking.booking_code,
                'total_amount', v_existing_booking.total_amount,
                'status', v_existing_booking.status,
                'is_idempotent_replay', true
            );
        ELSE
            RAISE EXCEPTION 'Phiên thanh toán này đã kết thúc (Trạng thái đơn: %). Vui lòng bắt đầu phiên đặt vé mới.', v_existing_booking.status;
        END IF;
    END IF;

    IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Vui lòng cung cấp họ và tên người nhận vé.';
    END IF;

    IF p_customer_email IS NULL OR TRIM(p_customer_email) = '' THEN
        RAISE EXCEPTION 'Vui lòng cung cấp địa chỉ email nhận vé.';
    END IF;

    IF p_customer_phone IS NULL OR TRIM(p_customer_phone) = '' THEN
        RAISE EXCEPTION 'Vui lòng cung cấp số điện thoại người nhận vé.';
    END IF;

    -- Fetch showtime info
    SELECT s.room_id, s.status, s.starts_at, s.price_regular, s.price_vip
    INTO v_showtime_room_id, v_showtime_status, v_showtime_starts_at, v_price_regular, v_price_vip
    FROM public.showtimes s
    WHERE s.id = p_showtime_id;

    IF v_showtime_room_id IS NULL THEN
        RAISE EXCEPTION 'Suất chiếu không tồn tại.';
    END IF;

    IF v_showtime_status != 'scheduled' THEN
        RAISE EXCEPTION 'Suất chiếu không ở trạng thái sẵn sàng (Trạng thái: %).', v_showtime_status;
    END IF;

    -- Evaluate future schedule using actual wall-clock timing (clock_timestamp)
    IF v_showtime_starts_at <= pg_catalog.clock_timestamp() THEN
        RAISE EXCEPTION 'Suất chiếu đã bắt đầu hoặc đã qua giờ mở bán.';
    END IF;

    -- Verify that the caller currently holds ALL requested seats and the holds have not expired
    -- Uses clock_timestamp() so that any delay is evaluated against true wall clock
    SELECT count(*) INTO v_held_count
    FROM public.seat_holds
    WHERE showtime_id = p_showtime_id
      AND seat_id = ANY(v_sorted_seat_ids)
      AND user_id = v_user_id
      AND expires_at > pg_catalog.clock_timestamp();

    IF v_held_count != cardinality(v_sorted_seat_ids) THEN
        RAISE EXCEPTION 'Thời gian giữ ghế đã hết hạn hoặc một số ghế không thuộc phiên giữ của bạn. Vui lòng chọn lại ghế.';
    END IF;

    -- Verify none of the seats are in showtime_seats (already sold)
    IF EXISTS (
        SELECT 1 FROM public.showtime_seats
        WHERE showtime_id = p_showtime_id AND seat_id = ANY(v_sorted_seat_ids)
    ) THEN
        RAISE EXCEPTION 'Một hoặc nhiều ghế đã được xác nhận bán cho khách hàng khác.';
    END IF;

    -- Calculate total price strictly from database seat classification
    FOR s_rec IN
        SELECT id, seat_type
        FROM public.seats
        WHERE id = ANY(v_sorted_seat_ids)
    LOOP
        v_seat_price := CASE s_rec.seat_type
            WHEN 'vip' THEN v_price_vip
            WHEN 'couple' THEN ROUND(v_price_vip * 1.8, -3)
            ELSE v_price_regular
        END;
        v_calculated_total := v_calculated_total + v_seat_price;
    END LOOP;

    -- Generate unique booking code e.g. CN-261102-A8F2K
    v_booking_code := 'CN-' || pg_catalog.to_char(pg_catalog.clock_timestamp(), 'YYMMDD') || '-' ||
                      pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 5));

    -- ATOMIC CONCURRENT INSERT WITH EXCEPTION HANDLER (Eliminating TOCTOU race):
    -- If two concurrent requests with identical (user_id, idempotency_key) pass the initial check simultaneously,
    -- the unique constraint idx_bookings_user_idempotency will trigger unique_violation on one of them.
    -- The exception handler catches it, verifies payload compatibility, and replays the winning booking row!
    BEGIN
        INSERT INTO public.bookings (
            user_id,
            showtime_id,
            total_amount,
            status,
            booking_code,
            customer_name,
            customer_email,
            customer_phone,
            idempotency_key,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            p_showtime_id,
            v_calculated_total,
            'pending',
            v_booking_code,
            TRIM(p_customer_name),
            TRIM(p_customer_email),
            TRIM(p_customer_phone),
            v_clean_idempotency,
            pg_catalog.clock_timestamp(),
            pg_catalog.clock_timestamp()
        ) RETURNING id INTO v_booking_id;
    EXCEPTION WHEN unique_violation THEN
        SELECT b.id, b.booking_code, b.total_amount, b.status, b.showtime_id
        INTO v_existing_booking
        FROM public.bookings b
        WHERE b.user_id = v_user_id
          AND b.idempotency_key = v_clean_idempotency;

        IF v_existing_booking.id IS NOT NULL THEN
            SELECT array_agg(seat_id ORDER BY seat_id ASC)
            INTO v_existing_seats
            FROM public.booking_seats
            WHERE booking_id = v_existing_booking.id;

            IF v_existing_booking.showtime_id IS DISTINCT FROM p_showtime_id
               OR v_existing_seats IS DISTINCT FROM v_sorted_seat_ids THEN
                RAISE EXCEPTION 'Khóa idempotency đã được sử dụng với thông tin đặt vé khác.';
            END IF;

            IF v_existing_booking.status IN ('pending', 'confirmed') THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'booking_id', v_existing_booking.id,
                    'booking_code', v_existing_booking.booking_code,
                    'total_amount', v_existing_booking.total_amount,
                    'status', v_existing_booking.status,
                    'is_idempotent_replay', true
                );
            ELSE
                RAISE EXCEPTION 'Phiên thanh toán này đã kết thúc (Trạng thái đơn: %). Vui lòng bắt đầu phiên đặt vé mới.', v_existing_booking.status;
            END IF;
        ELSE
            RAISE;
        END IF;
    END;

    -- Insert booking seats with verified database prices
    FOR s_rec IN
        SELECT id, seat_type
        FROM public.seats
        WHERE id = ANY(v_sorted_seat_ids)
    LOOP
        v_seat_price := CASE s_rec.seat_type
            WHEN 'vip' THEN v_price_vip
            WHEN 'couple' THEN ROUND(v_price_vip * 1.8, -3)
            ELSE v_price_regular
        END;

        INSERT INTO public.booking_seats (booking_id, seat_id, price)
        VALUES (v_booking_id, s_rec.id, v_seat_price);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'total_amount', v_calculated_total,
        'status', 'pending'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_transaction(UUID, UUID[], TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_transaction(UUID, UUID[], TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Atomic Demo Payment Confirmation RPC: confirm_demo_payment (Structured Return & Rollback Correctness)
-- Guarantees:
-- 1. Uses structured JSON returns so that state updates (e.g. marking booking 'expired') are cleanly COMMITTED
--    instead of rolled back by unhandled exceptions.
-- 2. Locks booking row with FOR UPDATE.
-- 3. Locks seat_holds in identical ascending order (ORDER BY seat_id ASC FOR UPDATE) eliminating deadlocks.
-- 4. CRITICAL: Verifies ALL seats in booking are STILL held by caller in seat_holds and UNEXPIRED.
--    If hold expired or taken by another user, booking is marked 'expired' and failure is returned.
--    Zero payments, zero tickets, and zero showtime_seats records are committed upon failure.
-- 5. Idempotently returns existing confirmation if already confirmed.
CREATE OR REPLACE FUNCTION public.confirm_demo_payment(
    p_booking_id UUID,
    p_payment_method TEXT DEFAULT 'momo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
    v_booking RECORD;
    v_seat_ids UUID[];
    v_txn_id TEXT;
    v_already_sold_count INTEGER;
    v_valid_holds_count INTEGER;
    v_tickets_payload JSONB := '[]'::JSONB;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message', 'Vui lòng đăng nhập để xác nhận thanh toán.'
        );
    END IF;

    SELECT (role = 'admin') INTO v_is_admin
    FROM public.profiles
    WHERE id = v_user_id;

    -- 1. Lock the booking row for atomic transaction processing
    SELECT b.*, s.movie_id, s.room_id, s.starts_at, s.ends_at, s.status AS showtime_status, s.format
    INTO v_booking
    FROM public.bookings b
    JOIN public.showtimes s ON s.id = b.showtime_id
    WHERE b.id = p_booking_id
    FOR UPDATE;

    IF v_booking.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'Đơn đặt vé không tồn tại.'
        );
    END IF;

    -- 2. NULL-SAFE Permission check: caller must own this booking or be admin
    -- Using IS DISTINCT FROM guarantees that bookings with user_id IS NULL are never accessible by patrons.
    IF (v_booking.user_id IS DISTINCT FROM v_user_id) AND (v_is_admin IS NOT TRUE) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'FORBIDDEN',
            'message', 'Bạn không có quyền thanh toán cho đơn đặt vé này.'
        );
    END IF;

    -- 3. IDEMPOTENCY CHECK: If already confirmed, return existing tickets safely without re-inserting
    IF v_booking.status = 'confirmed' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'ticket_id', t.id,
                'ticket_code', t.ticket_code,
                'qr_token', t.qr_token,
                'status', t.status,
                'seat_number', st.row_label || st.seat_number::TEXT,
                'seat_type', st.seat_type
            )
        ) INTO v_tickets_payload
        FROM public.tickets t
        JOIN public.seats st ON st.id = t.seat_id
        WHERE t.booking_id = p_booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Đơn đặt vé đã được thanh toán và xác nhận trước đó.',
            'booking_id', v_booking.id,
            'booking_code', v_booking.booking_code,
            'status', 'confirmed',
            'is_idempotent_replay', true,
            'tickets', COALESCE(v_tickets_payload, '[]'::JSONB)
        );
    END IF;

    IF v_booking.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_STATUS',
            'message', 'Đơn hàng không ở trạng thái chờ thanh toán (Trạng thái hiện tại: ' || v_booking.status || ').'
        );
    END IF;

    -- 4. Verify showtime is still active and in the future
    IF v_booking.showtime_status != 'scheduled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SHOWTIME_CANCELLED',
            'message', 'Suất chiếu đã bị hủy hoặc không sẵn sàng để nhận thanh toán.'
        );
    END IF;

    IF v_booking.starts_at <= pg_catalog.clock_timestamp() THEN
        -- Mark booking expired as showtime has passed
        UPDATE public.bookings
        SET status = 'expired', updated_at = pg_catalog.clock_timestamp()
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'SHOWTIME_PASSED',
            'message', 'Suất chiếu đã bắt đầu hoặc đã qua giờ chiếu. Giao dịch bị từ chối.'
        );
    END IF;

    -- 5. Fetch seats associated with this booking in ascending order
    SELECT array_agg(seat_id ORDER BY seat_id ASC) INTO v_seat_ids
    FROM public.booking_seats
    WHERE booking_id = p_booking_id;

    IF v_seat_ids IS NULL OR cardinality(v_seat_ids) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_SEATS',
            'message', 'Không tìm thấy thông tin ghế trong đơn vé.'
        );
    END IF;

    -- 6. Lock seat_holds rows for these seats strictly in ascending order
    -- Identical lock order with acquire_seat_hold eliminates any possibility of deadlock!
    PERFORM 1 FROM public.seat_holds
    WHERE showtime_id = v_booking.showtime_id
      AND seat_id = ANY(v_seat_ids)
    ORDER BY seat_id ASC
    FOR UPDATE;

    -- 7. Check if any seat was booked by another confirmed transaction
    SELECT count(*) INTO v_already_sold_count
    FROM public.showtime_seats
    WHERE showtime_id = v_booking.showtime_id
      AND seat_id = ANY(v_seat_ids);

    IF v_already_sold_count > 0 THEN
        UPDATE public.bookings
        SET status = 'cancelled', updated_at = pg_catalog.clock_timestamp()
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'SEAT_ALREADY_SOLD',
            'message', 'Một hoặc nhiều ghế trong đơn này đã bị đặt bởi khách hàng khác. Giao dịch không thể hoàn tất.'
        );
    END IF;

    -- 8. CRITICAL PAYMENT EXPIRATION CHECK:
    -- Verify that ALL seats of this booking are STILL held by this caller and STILL UNEXPIRED!
    -- Uses clock_timestamp() so that any elapsed wall-clock time spent waiting for row-level locks
    -- in Step 6 is strictly evaluated against actual expiration!
    SELECT count(*) INTO v_valid_holds_count
    FROM public.seat_holds
    WHERE showtime_id = v_booking.showtime_id
      AND seat_id = ANY(v_seat_ids)
      AND user_id = v_booking.user_id
      AND expires_at > pg_catalog.clock_timestamp();

    IF v_valid_holds_count != cardinality(v_seat_ids) THEN
        -- Mark booking as expired in database so it cannot be retried.
        -- Because we return a structured failure instead of raising an unhandled exception,
        -- this status update is cleanly COMMITTED in PostgreSQL!
        UPDATE public.bookings
        SET status = 'expired',
            updated_at = pg_catalog.clock_timestamp()
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'HOLD_EXPIRED',
            'message', 'Thời gian giữ ghế cho đơn vé này đã hết hạn. Ghế đã được giải phóng để bảo đảm tính công bằng. Vui lòng đặt lại.'
        );
    END IF;

    -- 9. Claim seats permanently into showtime_seats (Primary Key prevents any race condition)
    INSERT INTO public.showtime_seats (showtime_id, seat_id, booking_id, created_at)
    SELECT v_booking.showtime_id, s_id, p_booking_id, pg_catalog.clock_timestamp()
    FROM unnest(v_seat_ids) AS s_id;

    -- 10. Generate demo transaction ID using native UUID randomness
    v_txn_id := 'DEMO-TXN-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 12));

    -- 11. Record completed payment
    INSERT INTO public.payments (
        booking_id,
        amount,
        payment_method,
        status,
        transaction_id,
        created_at
    ) VALUES (
        p_booking_id,
        v_booking.total_amount,
        p_payment_method,
        'completed',
        v_txn_id,
        pg_catalog.clock_timestamp()
    );

    -- 12. Clear temporary seat holds for this showtime and seats
    DELETE FROM public.seat_holds
    WHERE showtime_id = v_booking.showtime_id
      AND seat_id = ANY(v_seat_ids);

    -- 13. Issue QR Tickets for each seat in booking with 64-character high-entropy cryptographic QR tokens
    INSERT INTO public.tickets (
        booking_id,
        seat_id,
        ticket_code,
        qr_token,
        status,
        created_at
    )
    SELECT
        p_booking_id,
        bs.seat_id,
        'TKT-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 8)),
        'CNQR-' || pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '') || pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
        'valid',
        pg_catalog.clock_timestamp()
    FROM public.booking_seats bs
    WHERE bs.booking_id = p_booking_id;

    -- 14. Update booking status to confirmed
    UPDATE public.bookings
    SET status = 'confirmed',
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = p_booking_id;

    -- 15. Aggregate ticket details for the response
    SELECT jsonb_agg(
        jsonb_build_object(
            'ticket_id', t.id,
            'ticket_code', t.ticket_code,
            'qr_token', t.qr_token,
            'status', t.status,
            'seat_number', st.row_label || st.seat_number::TEXT,
            'seat_type', st.seat_type
        )
    ) INTO v_tickets_payload
    FROM public.tickets t
    JOIN public.seats st ON st.id = t.seat_id
    WHERE t.booking_id = p_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Thanh toán mô phỏng thành công! Vé điện tử đã được phát hành.',
        'booking_id', v_booking.id,
        'booking_code', v_booking.booking_code,
        'transaction_id', v_txn_id,
        'status', 'confirmed',
        'total_amount', v_booking.total_amount,
        'payment_method', p_payment_method,
        'tickets', COALESCE(v_tickets_payload, '[]'::JSONB)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_demo_payment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_demo_payment(UUID, TEXT) TO authenticated;

-- 5. Check-in RPC: check_in_ticket (by QR token) (Hardened)
-- Checks Admin/Staff role FIRST.
-- Validates confirmed booking status, active showtime, and operational entry window (2 hours before starts_at to 30 mins after ends_at).
-- Uses atomic conditional update to guarantee that concurrent scans cannot double-check-in.
CREATE OR REPLACE FUNCTION public.check_in_ticket(p_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_ticket RECORD;
    v_rows_affected INTEGER;
BEGIN
    -- SECURITY GUARD: Check permission as the very first instruction
    SELECT public.is_staff_or_admin() INTO v_is_authorized;
    IF v_is_authorized IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'FORBIDDEN',
            'message', 'Từ chối truy cập: Chỉ nhân viên hoặc quản trị viên mới có quyền soát vé.'
        );
    END IF;

    IF p_qr_token IS NULL OR TRIM(p_qr_token) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_INPUT',
            'message', 'Mã QR không hợp lệ.'
        );
    END IF;

    -- Lookup ticket with full relations
    SELECT
        t.id,
        t.ticket_code,
        t.qr_token,
        t.status,
        t.checked_in_at,
        b.status AS booking_status,
        b.booking_code,
        b.customer_name,
        b.customer_phone,
        b.customer_email,
        st.row_label || st.seat_number::TEXT AS seat_number,
        st.seat_type,
        m.title AS movie_title,
        m.poster_url AS movie_poster,
        sh.starts_at,
        sh.ends_at,
        sh.status AS showtime_status,
        sh.format,
        r.name AS hall_name,
        c.name AS cinema_name
    INTO v_ticket
    FROM public.tickets t
    JOIN public.bookings b ON b.id = t.booking_id
    JOIN public.seats st ON st.id = t.seat_id
    JOIN public.showtimes sh ON sh.id = b.showtime_id
    JOIN public.movies m ON m.id = sh.movie_id
    JOIN public.rooms r ON r.id = sh.room_id
    JOIN public.cinemas c ON c.id = r.cinema_id
    WHERE t.qr_token = TRIM(p_qr_token);

    IF v_ticket.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'Không tìm thấy vé trong hệ thống CINENOVA.'
        );
    END IF;

    -- Check booking status
    IF v_ticket.booking_status != 'confirmed' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_BOOKING_STATUS',
            'message', 'Đơn đặt vé này không ở trạng thái hợp lệ (Trạng thái đơn: ' || v_ticket.booking_status || ').'
        );
    END IF;

    -- Check showtime status
    IF v_ticket.showtime_status != 'scheduled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SHOWTIME_CANCELLED',
            'message', 'Suất chiếu của vé này đã bị hủy bỏ hoặc không sẵn sàng.'
        );
    END IF;

    -- Check showtime schedule window (opens 2 hours before showtime, closes 30 mins after show ends)
    IF pg_catalog.clock_timestamp() < (v_ticket.starts_at - INTERVAL '2 hours') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'TOO_EARLY',
            'message', 'Chưa đến giờ soát vé. Cửa phòng chiếu chỉ mở trước giờ chiếu 2 tiếng.',
            'ticket', jsonb_build_object(
                'movie_title', v_ticket.movie_title,
                'starts_at', v_ticket.starts_at
            )
        );
    END IF;

    IF pg_catalog.clock_timestamp() > (v_ticket.ends_at + INTERVAL '30 minutes') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'EXPIRED_SHOWTIME',
            'message', 'Suất chiếu này đã kết thúc. Vé không còn hiệu lực vào rạp.',
            'ticket', jsonb_build_object(
                'movie_title', v_ticket.movie_title,
                'ends_at', v_ticket.ends_at
            )
        );
    END IF;

    -- Check ticket status
    IF v_ticket.status = 'used' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_USED',
            'message', 'Vé này ĐÃ ĐƯỢC SỬ DỤNG trước đó vào lúc ' ||
                       pg_catalog.to_char(v_ticket.checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY') || '.',
            'ticket', jsonb_build_object(
                'ticket_code', v_ticket.ticket_code,
                'booking_code', v_ticket.booking_code,
                'movie_title', v_ticket.movie_title,
                'cinema_name', v_ticket.cinema_name,
                'hall_name', v_ticket.hall_name,
                'seat_number', v_ticket.seat_number,
                'checked_in_at', v_ticket.checked_in_at
            )
        );
    END IF;

    IF v_ticket.status != 'valid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_STATUS',
            'message', 'Vé không hợp lệ (Trạng thái vé: ' || v_ticket.status || ').',
            'ticket', jsonb_build_object(
                'ticket_code', v_ticket.ticket_code,
                'status', v_ticket.status
            )
        );
    END IF;

    -- Atomic check-in update with concurrency lock
    UPDATE public.tickets
    SET status = 'used',
        checked_in_at = pg_catalog.clock_timestamp()
    WHERE id = v_ticket.id
      AND status = 'valid';

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONCURRENT_SCAN',
            'message', 'Vé vừa được soát tại cổng khác trong cùng thời điểm!'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CHECKED_IN',
        'message', 'Soát vé thành công! Mời khách vào phòng chiếu.',
        'ticket', jsonb_build_object(
            'ticket_code', v_ticket.ticket_code,
            'booking_code', v_ticket.booking_code,
            'customer_name', v_ticket.customer_name,
            'customer_phone', v_ticket.customer_phone,
            'movie_title', v_ticket.movie_title,
            'movie_poster', v_ticket.movie_poster,
            'cinema_name', v_ticket.cinema_name,
            'hall_name', v_ticket.hall_name,
            'seat_number', v_ticket.seat_number,
            'seat_type', v_ticket.seat_type,
            'format', v_ticket.format,
            'starts_at', v_ticket.starts_at,
            'checked_in_at', pg_catalog.clock_timestamp()
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_ticket(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_ticket(TEXT) TO authenticated;

-- 6. Check-in RPC: check_in_ticket_by_code (Manual code entry fallback) (Hardened)
-- Verifies is_staff_or_admin() FIRST before querying tickets table.
-- Prevents unauthenticated/customer enumeration of valid ticket codes.
CREATE OR REPLACE FUNCTION public.check_in_ticket_by_code(p_ticket_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_qr_token TEXT;
BEGIN
    -- SECURITY GUARD: Check permission as the very first instruction!
    SELECT public.is_staff_or_admin() INTO v_is_authorized;
    IF v_is_authorized IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'FORBIDDEN',
            'message', 'Từ chối truy cập: Chỉ nhân viên hoặc quản trị viên mới có quyền soát vé.'
        );
    END IF;

    IF p_ticket_code IS NULL OR TRIM(p_ticket_code) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_INPUT',
            'message', 'Mã vé không được để trống.'
        );
    END IF;

    SELECT qr_token INTO v_qr_token
    FROM public.tickets
    WHERE ticket_code = UPPER(TRIM(p_ticket_code));

    IF v_qr_token IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'Mã vé "' || p_ticket_code || '" không tồn tại trong hệ thống CINENOVA.'
        );
    END IF;

    RETURN public.check_in_ticket(v_qr_token);
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_ticket_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_ticket_by_code(TEXT) TO authenticated;

-- ==============================================================================
-- 7. HARDENED RLS POLICIES & LEAST PRIVILEGE FOR TRANSACTION TABLES
-- Explicitly revokes direct customer write channels inherited from Phase 2.
-- Customer cannot forge total_amount, insert arbitrary seats, confirm payment,
-- or cancel confirmed bookings directly.
-- All transactional mutations MUST proceed via trusted SECURITY DEFINER RPCs:
--   - create_booking_transaction
--   - confirm_demo_payment
--   - check_in_ticket / check_in_ticket_by_code
-- ==============================================================================

-- A. Revoke all permissions from anon / PUBLIC on sensitive transaction tables
REVOKE ALL ON public.bookings FROM PUBLIC, anon;
REVOKE ALL ON public.booking_seats FROM PUBLIC, anon;
REVOKE ALL ON public.payments FROM PUBLIC, anon;
REVOKE ALL ON public.tickets FROM PUBLIC, anon;

-- B. Ensure authenticated role has necessary table privileges for Admin operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_seats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;

-- C. BOOKINGS POLICIES:
DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers update own pending bookings or admin manage" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers cancel own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings or admin view all" ON public.bookings;
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;

-- Customer can ONLY SELECT their own bookings; Admins can view all bookings
CREATE POLICY "Users can view own bookings or admin view all"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid()) 
        OR public.is_admin()
    );

-- Only Admins have direct INSERT, UPDATE, DELETE on bookings table
-- Customers MUST create bookings via create_booking_transaction() RPC!
CREATE POLICY "Admins manage bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- D. BOOKING SEATS POLICIES:
DROP POLICY IF EXISTS "Customers insert booking seats for own booking" ON public.booking_seats;
DROP POLICY IF EXISTS "Users can insert booking seats" ON public.booking_seats;
DROP POLICY IF EXISTS "Admins manage booking seats" ON public.booking_seats;
DROP POLICY IF EXISTS "Users view own booking seats" ON public.booking_seats;

-- Customer can ONLY SELECT seats belonging to their own bookings; Admins can view all
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

-- Only Admins have direct INSERT, UPDATE, DELETE on booking_seats table
CREATE POLICY "Admins manage booking seats"
    ON public.booking_seats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- E. PAYMENTS POLICIES:
DROP POLICY IF EXISTS "Customers record initial payment for own booking" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;

-- Customer can ONLY SELECT payments belonging to their own bookings; Admins can view all
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

-- Only Admins have direct INSERT, UPDATE, DELETE on payments table
-- Customers MUST execute payment via confirm_demo_payment() RPC!
CREATE POLICY "Admins manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- F. TICKETS POLICIES:
DROP POLICY IF EXISTS "Users view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins manage tickets" ON public.tickets;

-- Customer can ONLY SELECT tickets belonging to their own bookings; Admins can view all
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

-- Only Admins have direct INSERT, UPDATE, DELETE on tickets table
-- Ticket issuance is handled exclusively by confirm_demo_payment() RPC!
CREATE POLICY "Admins manage tickets"
    ON public.tickets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
