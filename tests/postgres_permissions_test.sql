-- CINENOVA Phase 3 / permissions test (readable PASS/FAIL, always ROLLBACK).
-- REQUIREMENTS: migrations 00003+00004 applied; SQL Editor privileged role;
-- >= 2 real profiles.role='customer' and >= 1 real profiles.role='admin'.
-- The script creates temporary DATA fixtures inside ONE transaction, and NEVER commits.
-- Run the WHOLE file in ONE execution. If any assertion fails, stop and ROLLBACK.
-- Not a migration. Does not create/modify auth.users or profiles.

BEGIN;
SET LOCAL statement_timeout = '30s';

DO $preflight$
DECLARE v_n_customer integer; v_n_admin integer;
BEGIN
  SELECT count(*) INTO v_n_customer FROM public.profiles WHERE role = 'customer';
  SELECT count(*) INTO v_n_admin FROM public.profiles WHERE role = 'admin';
  IF v_n_customer < 2 OR v_n_admin < 1 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: need >=2 REAL customer accounts and >=1 admin. Got customers=%, admins=%', v_n_customer, v_n_admin;
  END IF;
  IF to_regclass('public.showtime_seats') IS NULL
     OR to_regprocedure('public.acquire_seat_hold(uuid,uuid[])') IS NULL
     OR to_regprocedure('public.confirm_demo_payment(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Phase 3 migrations 3/4 are not installed.';
  END IF;
  RAISE NOTICE 'PASS PRECONDITIONS: Phase 3 RPC and real test users exist.';
END $preflight$;

-- Create a disposable fixture in this transaction. UUIDs are generated safely;
-- its movie, room, showtime, holds, bookings, payment and ticket all ROLLBACK.
DO $fixture$
DECLARE
  v_a uuid; v_b uuid; v_admin uuid;
  v_movie uuid; v_cinema uuid; v_room uuid; v_showtime uuid;
  v_d7 uuid; v_d8 uuid; v_booking_a uuid; v_booking_b uuid;
BEGIN
  SELECT id INTO v_a FROM public.profiles WHERE role='customer' ORDER BY id LIMIT 1;
  SELECT id INTO v_b FROM public.profiles WHERE role='customer' AND id<>v_a ORDER BY id LIMIT 1;
  SELECT id INTO v_admin FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1;

  INSERT INTO public.movies (title,poster_url,duration_minutes,release_date,age_rating,status)
  VALUES ('[CN-TEST-ROLLBACK] RLS movie','https://example.invalid/fixture.jpg',120,CURRENT_DATE,'P','now_showing')
  RETURNING id INTO v_movie;
  INSERT INTO public.cinemas (name,city,address,status)
  VALUES ('[CN-TEST-ROLLBACK] Cinema','Test City','Not a real address','active')
  RETURNING id INTO v_cinema;
  INSERT INTO public.rooms (cinema_id,name,room_type,capacity,status)
  VALUES (v_cinema,'[CN-TEST-ROLLBACK] Hall','standard',2,'active')
  RETURNING id INTO v_room;
  INSERT INTO public.seats (room_id,row_label,seat_number,seat_type,status)
  VALUES (v_room,'D',7,'vip','active') RETURNING id INTO v_d7;
  INSERT INTO public.seats (room_id,row_label,seat_number,seat_type,status)
  VALUES (v_room,'D',8,'vip','active') RETURNING id INTO v_d8;
  INSERT INTO public.showtimes (movie_id,room_id,starts_at,ends_at,format,price_regular,price_vip,status)
  VALUES (v_movie,v_room,clock_timestamp()+interval '2 days',clock_timestamp()+interval '2 days 2 hours',
          '2D Digital',90000,130000,'scheduled') RETURNING id INTO v_showtime;

  INSERT INTO public.bookings (user_id,showtime_id,total_amount,status,booking_code,
      customer_name,customer_email,customer_phone,idempotency_key)
  VALUES (v_a,v_showtime,130000,'pending','CN-TEST-A-'||replace(gen_random_uuid()::text,'-',''),
      'Fixture A','fixture-a@example.invalid','0000000000','rls-fixture-a-'||gen_random_uuid()::text)
  RETURNING id INTO v_booking_a;
  INSERT INTO public.bookings (user_id,showtime_id,total_amount,status,booking_code,
      customer_name,customer_email,customer_phone,idempotency_key)
  VALUES (v_b,v_showtime,130000,'confirmed','CN-TEST-B-'||replace(gen_random_uuid()::text,'-',''),
      'Fixture B','fixture-b@example.invalid','0000000000','rls-fixture-b-'||gen_random_uuid()::text)
  RETURNING id INTO v_booking_b;

  INSERT INTO public.booking_seats (booking_id,seat_id,price) VALUES (v_booking_b,v_d7,130000);
  INSERT INTO public.showtime_seats (showtime_id,seat_id,booking_id) VALUES (v_showtime,v_d7,v_booking_b);
  INSERT INTO public.seat_holds (showtime_id,seat_id,user_id,expires_at)
  VALUES (v_showtime,v_d8,v_a,clock_timestamp()+interval '5 minutes');
  INSERT INTO public.payments (booking_id,amount,payment_method,status,transaction_id)
  VALUES (v_booking_b,130000,'momo','completed','CN-TEST-'||gen_random_uuid()::text);
  INSERT INTO public.tickets (booking_id,seat_id,ticket_code,qr_token,status)
  VALUES (v_booking_b,v_d7,'TKT-CN-TEST-'||replace(gen_random_uuid()::text,'-',''),
      'CNQR-TEST-'||replace(gen_random_uuid()::text,'-',''),'valid');

  PERFORM set_config('cn_test.user_a',v_a::text,true);
  PERFORM set_config('cn_test.user_b',v_b::text,true);
  PERFORM set_config('cn_test.admin',v_admin::text,true);
  PERFORM set_config('cn_test.showtime',v_showtime::text,true);
  PERFORM set_config('cn_test.seat_d7',v_d7::text,true);
  PERFORM set_config('cn_test.seat_d8',v_d8::text,true);
  PERFORM set_config('cn_test.booking_a',v_booking_a::text,true);
  PERFORM set_config('cn_test.booking_b',v_booking_b::text,true);
  RAISE NOTICE 'PASS FIXTURE: 2 real users, 1 fixture showtime, 2 seats, 2 bookings, 1 hold, 1 sale, 1 payment/ticket.';
END $fixture$;

-- ============================================================================
-- ANONYMOUS. Denial may be SQLSTATE 42501 or 0 rows under RLS. Both acceptable.
-- Verify that the sanitized RPC is actually callable and returns exactly 2 seats.
-- ============================================================================
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $anon$
DECLARE n bigint;
BEGIN
  BEGIN
    SELECT count(*) INTO n FROM public.seat_holds;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL ANON: can read % seat_holds',n; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS ANON: no direct seat_holds rows';

  BEGIN
    SELECT count(*) INTO n FROM public.showtime_seats;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL ANON: can read % showtime_seats',n; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS ANON: no direct showtime_seats rows';

  BEGIN
    SELECT count(*) INTO n FROM public.bookings;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL ANON: can read % bookings',n; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS ANON: no direct bookings rows';

  SELECT count(*) INTO n FROM public.get_showtime_seat_statuses(current_setting('cn_test.showtime')::uuid);
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL ANON: sanitized RPC returned % seats, expected 2',n; END IF;
  RAISE NOTICE 'PASS ANON: sanitized seat-status RPC returns exactly 2 fixture seats';
END $anon$;
RESET ROLE;

-- ============================================================================
-- CUSTOMER A: fixture contains A's own pending booking, B's confirmed booking;
-- A's active hold at D8 and B's sold seat D7. Operations must be blocked by RLS.
-- Unexpected success is FAIL outside exception-catching block (no FALSE PASS).
-- ============================================================================
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('cn_test.user_a'),true);
DO $customer_a$
DECLARE n bigint; affected bigint; denied boolean;
BEGIN
  SELECT count(*) INTO n FROM public.bookings WHERE id=current_setting('cn_test.booking_a')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: cannot see OWN booking'; END IF;
  SELECT count(*) INTO n FROM public.bookings WHERE id=current_setting('cn_test.booking_b')::uuid;
  IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: can see booking of B'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: owns A booking, cannot see B booking';

  SELECT count(*) INTO n FROM public.tickets WHERE booking_id=current_setting('cn_test.booking_b')::uuid;
  IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: can see B ticket'; END IF;
  SELECT count(*) INTO n FROM public.payments WHERE booking_id=current_setting('cn_test.booking_b')::uuid;
  IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: can see B payment'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: B ticket/payment are private';

  BEGIN
    SELECT count(*) INTO n FROM public.seat_holds;
    IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct seat_holds returned % rows',n; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS CUSTOMER A: cannot read direct seat_holds even when own hold exists';
  BEGIN
    SELECT count(*) INTO n FROM public.showtime_seats;
    IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct sold-seat records visible'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'PASS CUSTOMER A: direct showtime_seats data private';

  denied:=false;
  BEGIN
    INSERT INTO public.bookings (user_id,showtime_id,total_amount,status,booking_code,
       customer_name,customer_email,customer_phone)
    VALUES (current_setting('cn_test.user_a')::uuid,current_setting('cn_test.showtime')::uuid,
       0,'confirmed','CN-FORGED-'||replace(gen_random_uuid()::text,'-',''),
       'Forgery','forgery@example.invalid','0000000000');
  EXCEPTION WHEN insufficient_privilege THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct INSERT bookings succeeded'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct forged booking rejected (42501)';

  denied:=false;
  BEGIN
    INSERT INTO public.booking_seats (booking_id,seat_id,price)
    VALUES (current_setting('cn_test.booking_a')::uuid,current_setting('cn_test.seat_d8')::uuid,0);
  EXCEPTION WHEN insufficient_privilege THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct INSERT booking_seats succeeded'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct booking_seats INSERT rejected (42501)';

  denied:=false;
  BEGIN
    INSERT INTO public.payments (booking_id,amount,payment_method,status,transaction_id)
    VALUES (current_setting('cn_test.booking_a')::uuid,0,'momo','completed',
       'CN-TEST-FORGED-'||gen_random_uuid()::text);
  EXCEPTION WHEN insufficient_privilege THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct INSERT payments succeeded'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct payment INSERT rejected (42501)';

  denied:=false;
  BEGIN
    INSERT INTO public.tickets (booking_id,seat_id,ticket_code,qr_token,status)
    VALUES (current_setting('cn_test.booking_a')::uuid,current_setting('cn_test.seat_d8')::uuid,
       'TKT-FORGED-'||gen_random_uuid()::text,'CNQR-FORGED-'||gen_random_uuid()::text,'valid');
  EXCEPTION WHEN insufficient_privilege THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct INSERT tickets succeeded'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct tickets INSERT rejected (42501)';

  denied:=false;
  BEGIN
    INSERT INTO public.seat_holds (showtime_id,seat_id,user_id,expires_at)
    VALUES (current_setting('cn_test.showtime')::uuid,current_setting('cn_test.seat_d7')::uuid,
       current_setting('cn_test.user_a')::uuid,clock_timestamp()+interval '5 minutes');
  EXCEPTION WHEN insufficient_privilege THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL CUSTOMER A: direct INSERT seat_holds succeeded'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct seat_holds INSERT rejected (42501)';

  BEGIN
    UPDATE public.bookings SET status='confirmed'
    WHERE id=current_setting('cn_test.booking_a')::uuid;
    GET DIAGNOSTICS affected=ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN affected:=0;
  END;
  IF affected<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: UPDATE own booking changed % row(s)', affected; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: direct booking UPDATE changed 0 rows';

  SELECT count(*) INTO n FROM public.get_showtime_seat_statuses(current_setting('cn_test.showtime')::uuid)
  WHERE (row_label='D' AND seat_number=7 AND is_booked)
     OR (row_label='D' AND seat_number=8 AND is_held_by_me);
  IF n<>2 THEN RAISE EXCEPTION 'FAIL CUSTOMER A: sanitized RPC booking/own hold flags incorrect'; END IF;
  RAISE NOTICE 'PASS CUSTOMER A: sanitized RPC shows sold D7 and own held D8';

  -- Do not call acquire/confirm here: the existing test hold and sold-seat fixtures
  -- are only for access control; RPC write logic is exercised in concurrency tests.
END $customer_a$;
RESET ROLE;

-- CUSTOMER B: can see B booking/ticket/payment; cannot see A booking/hold.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('cn_test.user_b'),true);
DO $customer_b$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.bookings WHERE id=current_setting('cn_test.booking_b')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL CUSTOMER B: own booking not visible'; END IF;
  SELECT count(*) INTO n FROM public.bookings WHERE id=current_setting('cn_test.booking_a')::uuid;
  IF n<>0 THEN RAISE EXCEPTION 'FAIL CUSTOMER B: A booking leaked'; END IF;
  SELECT count(*) INTO n FROM public.tickets WHERE booking_id=current_setting('cn_test.booking_b')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL CUSTOMER B: own ticket not visible'; END IF;
  SELECT count(*) INTO n FROM public.payments WHERE booking_id=current_setting('cn_test.booking_b')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL CUSTOMER B: own payment not visible'; END IF;
  RAISE NOTICE 'PASS CUSTOMER B: sees own booking, ticket and payment only';
  SELECT count(*) INTO n FROM public.get_showtime_seat_statuses(current_setting('cn_test.showtime')::uuid)
  WHERE row_label='D' AND seat_number=8 AND is_held AND NOT is_held_by_me;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL CUSTOMER B: other customer hold state incorrect'; END IF;
  RAISE NOTICE 'PASS CUSTOMER B: sees D8 held without owner identity';
END $customer_b$;
RESET ROLE;

-- ADMIN: must see the fixture rows, not merely succeed on count(*) >= 0.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('cn_test.admin'),true);
DO $admin$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.bookings
  WHERE id IN (current_setting('cn_test.booking_a')::uuid,current_setting('cn_test.booking_b')::uuid);
  IF n<>2 THEN RAISE EXCEPTION 'FAIL ADMIN: expected 2 fixture bookings, got %',n; END IF;
  SELECT count(*) INTO n FROM public.seat_holds WHERE showtime_id=current_setting('cn_test.showtime')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL ADMIN: expected 1 fixture hold, got %',n; END IF;
  SELECT count(*) INTO n FROM public.showtime_seats WHERE showtime_id=current_setting('cn_test.showtime')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'FAIL ADMIN: expected 1 sold seat, got %',n; END IF;
  RAISE NOTICE 'PASS ADMIN: can actually read 2 bookings, 1 hold and 1 sold seat';
END $admin$;
RESET ROLE;

ROLLBACK;
-- The transaction ROLLBACK above is mandatory: zero fixture rows persist.
-- The SQL test is PASS only if every assertion above passed AND ROLLBACK completed.
