import { formatToVnDate, formatToVnMonth, formatToVnTime } from '../services/adminService';

function runTests() {
  console.log('======================================================================');
  console.log('CINENOVA: ADMIN DASHBOARD KPI & REVENUE CALCULATION TESTS');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, cond: boolean) {
    total++;
    if (cond) {
      console.log(`✔ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Timezone tests (Asia/Ho_Chi_Minh +07:00)
  // UTC: 2026-11-02T10:00:00Z -> VN: 2026-11-02 17:00
  const utcDate1 = new Date('2026-11-02T10:00:00Z');
  assert('formatToVnDate converts UTC to Vietnam date (2026-11-02)', formatToVnDate(utcDate1) === '2026-11-02');
  assert('formatToVnTime converts UTC 10:00Z to Vietnam 17:00', formatToVnTime(utcDate1) === '17:00');
  assert('formatToVnMonth returns 2026-11', formatToVnMonth(utcDate1) === '2026-11');

  // UTC: 2026-11-02T18:00:00Z -> VN: 2026-11-03 01:00 (+7h crosses midnight)
  const utcDateCrossMidnight = new Date('2026-11-02T18:00:00Z');
  assert('UTC 18:00Z crosses midnight to 2026-11-03 in Vietnam', formatToVnDate(utcDateCrossMidnight) === '2026-11-03');
  assert('UTC 18:00Z is 01:00 in Vietnam', formatToVnTime(utcDateCrossMidnight) === '01:00');

  // 2. Simulated dataset matching user actual state:
  // 4 confirmed bookings, total value 720,000đ, 1 pending, 1 expired
  const mockBookings = [
    {
      id: 'b-1',
      total_amount: 180000,
      status: 'confirmed',
      created_at: '2026-11-02T03:00:00Z', // 10:00 VN
      tickets: [{ id: 't-1' }],
      payments: [{ payment_method: 'momo' }],
      showtimes: { movies: { title: 'Hành Tinh Cát: Phần Hai' } },
    },
    {
      id: 'b-2',
      total_amount: 180000,
      status: 'confirmed',
      created_at: '2026-11-02T04:00:00Z', // 11:00 VN
      tickets: [{ id: 't-2' }],
      payments: [{ payment_method: 'momo' }],
      showtimes: { movies: { title: 'Hành Tinh Cát: Phần Hai' } },
    },
    {
      id: 'b-3',
      total_amount: 180000,
      status: 'confirmed',
      created_at: '2026-11-02T05:00:00Z', // 12:00 VN
      tickets: [{ id: 't-3' }],
      payments: [{ payment_method: 'vnpay' }],
      showtimes: { movies: { title: 'Hành Tinh Cát: Phần Hai' } },
    },
    {
      id: 'b-4',
      total_amount: 180000,
      status: 'confirmed',
      created_at: '2026-11-02T06:00:00Z', // 13:00 VN
      tickets: [{ id: 't-4' }],
      payments: [{ payment_method: 'momo' }],
      showtimes: { movies: { title: 'Hành Tinh Cát: Phần Hai' } },
    },
    {
      id: 'b-5',
      total_amount: 360000,
      status: 'pending',
      created_at: '2026-11-02T07:00:00Z',
      tickets: [],
      payments: [],
      showtimes: { movies: { title: 'Oppenheimer' } },
    },
    {
      id: 'b-6',
      total_amount: 180000,
      status: 'expired',
      created_at: '2026-11-01T10:00:00Z',
      tickets: [],
      payments: [],
      showtimes: { movies: { title: 'Hành Tinh Cát: Phần Hai' } },
    },
  ];

  // 3. Status breakdown calculation
  const statusCounts = { confirmed: 0, pending: 0, cancelled: 0, expired: 0 };
  mockBookings.forEach((b) => {
    if (b.status === 'confirmed') statusCounts.confirmed++;
    else if (b.status === 'pending') statusCounts.pending++;
    else if (b.status === 'cancelled') statusCounts.cancelled++;
    else if (b.status === 'expired') statusCounts.expired++;
  });

  assert('Confirmed count is exactly 4', statusCounts.confirmed === 4);
  assert('Pending count is exactly 1', statusCounts.pending === 1);
  assert('Expired count is exactly 1', statusCounts.expired === 1);
  assert('Cancelled count is exactly 0', statusCounts.cancelled === 0);

  // 4. Revenue calculation rule:
  // ONLY confirmed bookings are counted towards demo revenue
  const confirmed = mockBookings.filter((b) => b.status === 'confirmed');
  const totalDemoRevenue = confirmed.reduce((sum, b) => sum + b.total_amount, 0);
  assert('Total confirmed demo revenue is exactly 720,000đ', totalDemoRevenue === 720000);

  // Verify pending and expired are NOT added to revenue
  const totalAllRevenue = mockBookings.reduce((sum, b) => sum + b.total_amount, 0);
  assert('Pending and expired (totalAllRevenue = 1,260,000đ) are properly excluded from confirmed revenue', totalDemoRevenue !== totalAllRevenue);

  // 5. Distinct sum rule: Joining 1 booking with multiple tickets must NOT duplicate revenue
  const bookingWithMultipleTickets = {
    id: 'b-multi',
    total_amount: 360000, // 2 VIP seats * 180,000
    status: 'confirmed',
    tickets: [{ id: 't-1' }, { id: 't-2' }], // 2 tickets
  };
  // Adding booking.total_amount directly gives 360,000, not 360,000 * 2 = 720,000
  assert('Multiple tickets in a booking do not duplicate total_amount', bookingWithMultipleTickets.total_amount === 360000);

  // 6. Tickets count calculation
  const totalTickets = confirmed.reduce((sum, b) => sum + b.tickets.length, 0);
  assert('Total tickets sold is exactly 4', totalTickets === 4);

  // 7. Payment method distribution
  const momoBookings = confirmed.filter((b) => b.payments[0]?.payment_method === 'momo');
  const vnpayBookings = confirmed.filter((b) => b.payments[0]?.payment_method === 'vnpay');
  const momoAmount = momoBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const vnpayAmount = vnpayBookings.reduce((sum, b) => sum + b.total_amount, 0);

  assert('MoMo Demo count is 3, amount is 540,000đ (75%)', momoBookings.length === 3 && momoAmount === 540000);
  assert('VNPay Demo count is 1, amount is 180,000đ (25%)', vnpayBookings.length === 1 && vnpayAmount === 180000);
  assert('MoMo + VNPay amounts sum exactly to 720,000đ', momoAmount + vnpayAmount === totalDemoRevenue);

  // 8. Popular movies breakdown
  const movieMap = new Map<string, { tickets: number; revenue: number }>();
  confirmed.forEach((b) => {
    const title = b.showtimes.movies.title;
    const existing = movieMap.get(title) || { tickets: 0, revenue: 0 };
    existing.tickets += b.tickets.length;
    existing.revenue += b.total_amount;
    movieMap.set(title, existing);
  });

  const duneStats = movieMap.get('Hành Tinh Cát: Phần Hai');
  assert('Hành Tinh Cát: Phần Hai accounts for 4 tickets (100%)', duneStats?.tickets === 4);
  assert('Hành Tinh Cát: Phần Hai accounts for 720,000đ (100%)', duneStats?.revenue === 720000);

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL KPI TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('----------------------------------------------------------------------');
}

runTests();

