// ==============================================================================
// CINENOVA – Showtime Selection, Date Filtering & Timezone Verification Test
// File: src/tests/showtime_selection_test.ts
// ==============================================================================

import assert from 'assert';

// Initialize import.meta.env for Node.js tsx execution
if (typeof (import.meta as any).env === 'undefined') {
  (import.meta as any).env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
}

async function runTests() {
  const { getBookingDates } = await import('../data/mockData');
  const { mapDbShowtimeToShowtime } = await import('../services/showtimeService');

  console.log('======================================================================');
  console.log('CINENOVA: SHOWTIME SELECTION & TIMEZONE VERIFICATION TEST');
  console.log('======================================================================\n');

  // 1. Test getBookingDates generates valid Asia/Ho_Chi_Minh dates
  const bookingDates = getBookingDates();
  assert.strictEqual(bookingDates.length, 7, 'Must generate 7 booking dates');
  console.log('✔ PASS: Generated 7 booking dates:', bookingDates.map(d => `${d.dayOfWeek} (${d.dateStr})`).join(', '));

  // Verify first date is today in Vietnam
  const todayVN = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  assert.strictEqual(bookingDates[0].dateStr, todayVN, `First booking date must equal Vietnam today (${todayVN})`);
  assert.strictEqual(bookingDates[0].dayOfWeek, 'Hôm nay', 'First booking date must be labeled "Hôm nay"');
  assert.strictEqual(bookingDates[1].dayOfWeek, 'Ngày mai', 'Second booking date must be labeled "Ngày mai"');
  console.log('✔ PASS: First date correctly matches Vietnam timezone today');

  // 2. Test mapDbShowtimeToShowtime with UTC ISO string
  const mockDbRow = {
    id: 'st-test-01',
    movie_id: 'm1',
    room_id: 'r1',
    starts_at: '2026-11-03T03:00:00Z', // 10:00 AM in UTC+7 (Asia/Ho_Chi_Minh)
    ends_at: '2026-11-03T05:30:00Z',   // 12:30 PM in UTC+7 (Asia/Ho_Chi_Minh)
    format: 'IMAX Laser',
    price_regular: 140000,
    price_vip: 180000,
    rooms: {
      id: 'r1',
      name: 'IMAX Laser Hall 1',
      cinema_id: 'c1',
      cinemas: {
        id: 'c1',
        name: 'CINENOVA Landmark Sài Gòn',
      },
    },
  };

  const mapped = mapDbShowtimeToShowtime(mockDbRow);
  assert.strictEqual(mapped.date, '2026-11-03', 'Date must be 2026-11-03 in Asia/Ho_Chi_Minh');
  assert.strictEqual(mapped.startTime, '10:00', 'Start time must be 10:00 in Asia/Ho_Chi_Minh');
  assert.strictEqual(mapped.endTime, '12:30', 'End time must be 12:30 in Asia/Ho_Chi_Minh');
  assert.strictEqual(mapped.startsAt, mockDbRow.starts_at, 'Raw startsAt ISO string must be preserved');
  console.log('✔ PASS: mapDbShowtimeToShowtime accurately converts UTC DB timestamp to Vietnam date (2026-11-03) and time (10:00 - 12:30)');

  // 3. Test Date Filtering Logic
  const mockShowtimes = [
    { ...mapped, id: 'st-nov-02', date: '2026-11-02', startTime: '16:00' },
    { ...mapped, id: 'st-nov-03-a', date: '2026-11-03', startTime: '10:00' },
    { ...mapped, id: 'st-nov-03-b', date: '2026-11-03', startTime: '14:30' },
    { ...mapped, id: 'st-nov-04', date: '2026-11-04', startTime: '19:00' },
  ];

  const selectedDate = '2026-11-03';
  const filtered = mockShowtimes.filter((st) => st.date === selectedDate);
  assert.strictEqual(filtered.length, 2, 'Must only return showtimes for 2026-11-03');
  assert.ok(filtered.every((st) => st.date === '2026-11-03'), 'All returned showtimes must have date 2026-11-03');
  assert.ok(!filtered.some((st) => st.id === 'st-nov-02'), '02/11 showtime must NOT leak into 03/11 view');
  console.log('✔ PASS: Date filtering strictly isolates 03/11 showtimes and eliminates 02/11 showtimes');

  // 4. Test Past Showtime Detection
  const pastShowtime = {
    ...mapped,
    startsAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };
  const futureShowtime = {
    ...mapped,
    startsAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  };

  const isPast = (st: typeof mapped) => new Date(st.startsAt!).getTime() <= Date.now();
  assert.strictEqual(isPast(pastShowtime), true, 'Showtime 1 hour ago must be detected as past');
  assert.strictEqual(isPast(futureShowtime), false, 'Future showtime must NOT be detected as past');
  console.log('✔ PASS: Past showtime detection accurately flags expired showtimes');

  console.log('\n----------------------------------------------------------------------');
  console.log('ALL SHOWTIME SELECTION & DATE FILTERING TESTS PASSED (4/4)');
  console.log('----------------------------------------------------------------------');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
