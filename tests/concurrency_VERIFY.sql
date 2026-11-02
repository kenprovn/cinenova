-- ==============================================================================
-- CINENOVA Phase 3 – Concurrency Verification Query (Hold State)
-- File: tests/concurrency_VERIFY.sql
-- ==============================================================================

SELECT 
  'f3a00000-0000-4000-8000-000000000004'::uuid AS showtime_id,
  s.id AS seat_id,
  s.row_label,
  s.seat_number,
  sh.user_id AS holder_user_id,
  (sh.expires_at > pg_catalog.clock_timestamp()) AS still_active,
  sh.expires_at,
  ss.booking_id AS sold_booking_id
FROM public.seats s
LEFT JOIN public.seat_holds sh 
  ON sh.seat_id = s.id AND sh.showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
LEFT JOIN public.showtime_seats ss 
  ON ss.seat_id = s.id AND ss.showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
WHERE s.room_id = 'f3a00000-0000-4000-8000-000000000003'::uuid
ORDER BY s.seat_number;

