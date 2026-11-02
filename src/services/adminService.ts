import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminStats, BookingRecord } from '../types';
import { MOCK_ADMIN_STATS, MOCK_ADMIN_BOOKINGS } from '../data/mockData';

export const adminService = {
  async getDashboardStats(): Promise<{ stats: AdminStats; isLiveDb: boolean }> {
    if (!isSupabaseConfigured) {
      return { stats: MOCK_ADMIN_STATS, isLiveDb: false };
    }

    try {
      // Count total movies
      const { count: _moviesCount } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'hidden');

      // Count showtimes
      const { count: _showtimesCount } = await supabase
        .from('showtimes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Count bookings
      const { count: bookingsCount, data: recentBookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsCount && bookingsCount > 0 && recentBookingsData) {
        // Return stats with live bookings
        const liveBookings: BookingRecord[] = recentBookingsData.map((b) => ({
          id: b.id,
          bookingCode: b.booking_code,
          movieTitle: 'Vé đặt trực tuyến',
          moviePoster: '',
          cinemaName: 'CINENOVA Cinema',
          hallName: 'Phòng Chiếu',
          date: new Date(b.created_at).toLocaleDateString('vi-VN'),
          time: new Date(b.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          seats: ['Chờ check-in'],
          totalPrice: Number(b.total_amount),
          customerName: b.customer_name || 'Khách hàng',
          customerEmail: b.customer_email || '',
          customerPhone: b.customer_phone || '',
          paymentMethod: 'Đã thanh toán',
          status: b.status === 'confirmed' ? 'confirmed' : 'pending',
          createdAt: new Date(b.created_at).toLocaleString('vi-VN'),
        }));

        return {
          stats: {
            ...MOCK_ADMIN_STATS,
            todayTickets: bookingsCount,
            recentBookings: liveBookings,
          },
          isLiveDb: true,
        };
      }

      // If no bookings in DB yet, show mock metrics with clear tag
      return { stats: MOCK_ADMIN_STATS, isLiveDb: false };
    } catch {
      return { stats: MOCK_ADMIN_STATS, isLiveDb: false };
    }
  },

  async getBookings(): Promise<BookingRecord[]> {
    if (!isSupabaseConfigured) return MOCK_ADMIN_BOOKINGS;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return MOCK_ADMIN_BOOKINGS;
      }

      return data.map((b) => ({
        id: b.id,
        bookingCode: b.booking_code,
        movieTitle: 'Đơn đặt vé trực tuyến',
        moviePoster: '',
        cinemaName: 'CINENOVA Cinema',
        hallName: 'Phòng Chiếu',
        date: new Date(b.created_at).toLocaleDateString('vi-VN'),
        time: new Date(b.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        seats: [],
        totalPrice: Number(b.total_amount),
        customerName: b.customer_name || 'Khách hàng',
        customerEmail: b.customer_email || '',
        customerPhone: b.customer_phone || '',
        paymentMethod: 'Cổng thanh toán',
        status: b.status === 'confirmed' ? 'confirmed' : 'pending',
        createdAt: new Date(b.created_at).toLocaleString('vi-VN'),
      }));
    } catch {
      return MOCK_ADMIN_BOOKINGS;
    }
  },
};
