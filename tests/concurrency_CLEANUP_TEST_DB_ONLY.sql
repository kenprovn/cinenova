-- ==============================================================================
-- CINENOVA Phase 3 – Cleanup Fixtures (TEST DB ONLY)
-- File: tests/concurrency_CLEANUP_TEST_DB_ONLY.sql
-- ==============================================================================

DO $$
BEGIN
  IF current_setting('cinenova_test.allow_write', true) IS DISTINCT FROM 'YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT' THEN
    RAISE EXCEPTION 'GUARD ACTIVATED: Cannot run cleanup without explicit session configuration: SET cinenova_test.allow_write = ''YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT'';';
  END IF;
END $$;

BEGIN;

-- 1. Tickets for fixture bookings
DELETE FROM public.tickets
WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
);

-- 2. Payments for fixture bookings
DELETE FROM public.payments
WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
);

-- 3. Showtime seats for fixture showtime
DELETE FROM public.showtime_seats
WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

-- 4. Booking seats for fixture bookings
DELETE FROM public.booking_seats
WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
);

-- 5. Bookings for fixture showtime
DELETE FROM public.bookings
WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

-- 6. Seat holds for fixture showtime
DELETE FROM public.seat_holds
WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

-- 7. Showtime
DELETE FROM public.showtimes
WHERE id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

-- 8. Seats D7, D8
DELETE FROM public.seats
WHERE room_id = 'f3a00000-0000-4000-8000-000000000003'::uuid;

-- 9. Room
DELETE FROM public.rooms
WHERE id = 'f3a00000-0000-4000-8000-000000000003'::uuid;

-- 10. Movie
DELETE FROM public.movies
WHERE id = 'f3a00000-0000-4000-8000-000000000001'::uuid;

-- 11. Cinema
DELETE FROM public.cinemas
WHERE id = 'f3a00000-0000-4000-8000-000000000002'::uuid;

COMMIT;

SELECT 'CLEANUP COMPLETE: all fixture records removed.' AS status;

