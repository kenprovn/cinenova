-- CINENOVA Phase 3 / Concurrency testing: READ-ONLY ENTRY CHECK.
-- Do NOT use two scripts sequentially in this one SQL Editor tab as proof of concurrency.
-- See HUONG_DAN_KIEM_THU.md for real session A / B steps.
-- This file is safe to run after setup; it never writes data.
DO $preflight$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.showtimes sh
  JOIN public.rooms r ON r.id=sh.room_id
  JOIN public.movies m ON m.id=sh.movie_id
  WHERE sh.id='f3a00000-0000-4000-8000-000000000004'::uuid
    AND r.name='[CN-TEST-ONLY] Hall'
    AND m.title='[CN-TEST-ONLY] Concurrency movie'
    AND sh.starts_at>clock_timestamp();
  IF n<>1 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: dedicated FUTURE TEST showtime missing. Run setup on TEST project only.';
  END IF;
  SELECT count(*) INTO n FROM public.seats s
  WHERE s.room_id='f3a00000-0000-4000-8000-000000000003'::uuid
    AND s.row_label='D' AND s.seat_number IN (7,8);
  IF n<>2 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: fixture seats D7/D8 missing';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS: fixture exists, correct room, D7/D8 valid. CONCURRENCY NOT YET TESTED.';
END $preflight$;
SELECT 'f3a00000-0000-4000-8000-000000000004'::uuid AS test_showtime_id,
       s.id AS seat_id,s.row_label,s.seat_number
FROM public.seats s
WHERE s.room_id='f3a00000-0000-4000-8000-000000000003'::uuid
ORDER BY s.seat_number;
-- Next: use concurrency_A_HOLD.psql and concurrency_B_HOLD.psql
-- in two independent persistent psql connections (see README).
