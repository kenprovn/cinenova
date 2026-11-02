-- ==============================================================================
-- CINENOVA Phase 3 – Concurrency Test Fixture Setup (TEST DB ONLY)
-- File: tests/concurrency_SETUP_TEST_DB_ONLY.sql
-- WARNING: ONLY run this script on a dedicated disposable TEST database!
-- ==============================================================================

DO $$
BEGIN
  IF current_setting('cinenova_test.allow_write', true) IS DISTINCT FROM 'YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT' THEN
    RAISE EXCEPTION 'GUARD ACTIVATED: Cannot run test fixture setup without explicit session configuration: SET cinenova_test.allow_write = ''YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT'';';
  END IF;
END $$;

BEGIN;

-- 1. Test Cinema
INSERT INTO public.cinemas (id, name, city, address, status)
VALUES (
  'f3a00000-0000-4000-8000-000000000002'::uuid,
  '[CN-TEST-ONLY] Cinema',
  'Test City',
  'Disposable Test Address',
  'active'
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 2. Test Room (Standard hall with 2 capacity)
INSERT INTO public.rooms (id, cinema_id, name, room_type, capacity, status)
VALUES (
  'f3a00000-0000-4000-8000-000000000003'::uuid,
  'f3a00000-0000-4000-8000-000000000002'::uuid,
  '[CN-TEST-ONLY] Hall',
  'standard',
  2,
  'active'
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 3. Test Movie
INSERT INTO public.movies (id, title, poster_url, duration_minutes, release_date, age_rating, status)
VALUES (
  'f3a00000-0000-4000-8000-000000000001'::uuid,
  '[CN-TEST-ONLY] Concurrency movie',
  'https://example.invalid/fixture.jpg',
  120,
  CURRENT_DATE,
  'P',
  'now_showing'
)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, status = EXCLUDED.status;

-- 4. Test Seats D7 & D8
INSERT INTO public.seats (id, room_id, row_label, seat_number, seat_type, status)
VALUES 
  ('f3a00000-0000-4000-8000-000000000007'::uuid, 'f3a00000-0000-4000-8000-000000000003'::uuid, 'D', 7, 'vip', 'active'),
  ('f3a00000-0000-4000-8000-000000000008'::uuid, 'f3a00000-0000-4000-8000-000000000003'::uuid, 'D', 8, 'vip', 'active')
ON CONFLICT (id) DO UPDATE 
SET status = 'active';

-- 5. Test Showtime (Guaranteed future start date: 7 days ahead)
INSERT INTO public.showtimes (id, movie_id, room_id, starts_at, ends_at, format, price_regular, price_vip, status)
VALUES (
  'f3a00000-0000-4000-8000-000000000004'::uuid,
  'f3a00000-0000-4000-8000-000000000001'::uuid,
  'f3a00000-0000-4000-8000-000000000003'::uuid,
  pg_catalog.clock_timestamp() + interval '7 days',
  pg_catalog.clock_timestamp() + interval '7 days 2 hours',
  '2D Digital',
  90000,
  130000,
  'scheduled'
)
ON CONFLICT (id) DO UPDATE 
SET starts_at = EXCLUDED.starts_at, 
    ends_at = EXCLUDED.ends_at, 
    status = 'scheduled';

COMMIT;

SELECT 'SETUP COMPLETE: Fixture showtime f3a00000-0000-4000-8000-000000000004 created successfully.' AS status;

