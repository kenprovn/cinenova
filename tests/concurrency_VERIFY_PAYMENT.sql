-- ==============================================================================
-- CINENOVA Phase 3 – Concurrency Verification Query (Payment & Invariants)
-- File: tests/concurrency_VERIFY_PAYMENT.sql
-- ==============================================================================

WITH check_sold AS (
  SELECT count(*) = 1 AS is_sold
  FROM public.showtime_seats
  WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
    AND seat_id = 'f3a00000-0000-4000-8000-000000000007'::uuid
),
check_hold AS (
  SELECT count(*) = 0 AS is_cleared
  FROM public.seat_holds
  WHERE showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
    AND seat_id = 'f3a00000-0000-4000-8000-000000000007'::uuid
),
check_ticket AS (
  SELECT count(*) = 1 AS is_issued
  FROM public.tickets t
  JOIN public.bookings b ON b.id = t.booking_id
  WHERE b.showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
    AND t.seat_id = 'f3a00000-0000-4000-8000-000000000007'::uuid
    AND t.status = 'valid'
    AND t.qr_token IS NOT NULL
),
check_payment AS (
  SELECT count(*) = 1 AS is_paid
  FROM public.payments p
  JOIN public.bookings b ON b.id = p.booking_id
  WHERE b.showtime_id = 'f3a00000-0000-4000-8000-000000000004'::uuid
    AND p.status = 'completed'
)
SELECT 
  cs.is_sold AS seat_is_sold,
  ch.is_cleared AS hold_cleared,
  ct.is_issued AS ticket_issued,
  cp.is_paid AS payment_recorded,
  (cs.is_sold AND ch.is_cleared AND ct.is_issued AND cp.is_paid) AS database_invariants_pass
FROM check_sold cs
CROSS JOIN check_hold ch
CROSS JOIN check_ticket ct
CROSS JOIN check_payment cp;

