-- ==============================================================================
-- CINENOVA Phase 3 – Reset Holds on Fixture Showtime (TEST DB ONLY)
-- File: tests/concurrency_RESET_HOLDS_TEST_DB_ONLY.sql
-- ==============================================================================

DO $$
BEGIN
  IF current_setting('cinenova_test.allow_write', true) IS DISTINCT FROM 'YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT' THEN
    RAISE EXCEPTION 'GUARD ACTIVATED: Cannot reset test holds without explicit session configuration: SET cinenova_test.allow_write = ''YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT'';';
  END IF;
END $$;

BEGIN;

DELETE FROM public.seat_holds
WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

COMMIT;

SELECT count(*) AS remaining_holds
FROM public.seat_holds
WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid;

