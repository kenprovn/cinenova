import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Seat, BookingRecord, TicketInfo, CheckInResult, SeatType } from '../types';
import { generateMockSeats } from '../data/mockData';
import { adminService, formatToVnDate, formatToVnTime } from './adminService';

export interface CreateBookingParams {
  showtimeId: string;
  seatIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod?: string;
  idempotencyKey?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  bookingCode?: string;
  totalAmount?: number;
  status?: string;
  error?: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  message?: string;
  bookingId?: string;
  bookingCode?: string;
  transactionId?: string;
  status?: string;
  totalAmount?: number;
  paymentMethod?: string;
  tickets?: TicketInfo[];
  error?: string;
}

export interface UserBookingHistoryItem {
  id: string;
  bookingCode: string;
  createdAt: string;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'expired';
  customerName: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  hallName: string;
  showtimeDate: string;
  showtimeStart: string;
  showtimeEnd: string;
  showtimeFormat: string;
  seats: string[];
  tickets: TicketInfo[];
  payment?: {
    paymentMethod: string;
    transactionId: string;
    status: string;
  };
}

export const bookingService = {
  /**
   * Fetches the sanitized real-time seat layout from PostgreSQL
   * via RPC get_showtime_seat_statuses(p_showtime_id).
   */
  async getShowtimeSeats(
    showtimeId: string,
    fallbackRegularPrice = 95000,
    fallbackVipPrice = 130000
  ): Promise<{ seats: Seat[]; isLiveDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return {
        seats: generateMockSeats(showtimeId, fallbackRegularPrice, fallbackVipPrice),
        isLiveDb: false,
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_showtime_seat_statuses', {
        p_showtime_id: showtimeId,
      });

      if (error || !data || data.length === 0) {
        // Fallback to local layout if migration not yet executed on Cloud
        return {
          seats: generateMockSeats(showtimeId, fallbackRegularPrice, fallbackVipPrice),
          isLiveDb: false,
          error: error?.message,
        };
      }

      const seats: Seat[] = data.map((item: any) => {
        let status: Seat['status'] = 'available';
        if (item.status === 'disabled') status = 'disabled';
        else if (item.status === 'booked' || item.is_booked) status = 'booked';
        else if (item.status === 'selected' || item.is_held_by_me) status = 'selected';
        else if (item.status === 'held' || item.is_held) status = 'held';

        return {
          id: item.seat_id,
          row: item.row_label,
          col: item.seat_number,
          seatNumber: `${item.row_label}${item.seat_number}`,
          type: item.seat_type as SeatType,
          status,
          price: Number(item.price),
          expiresAt: item.expires_at || null,
        };
      });

      return { seats, isLiveDb: true };
    } catch (err: any) {
      return {
        seats: generateMockSeats(showtimeId, fallbackRegularPrice, fallbackVipPrice),
        isLiveDb: false,
        error: err.message,
      };
    }
  },

  /**
   * Acquires a 5-minute atomic hold for the specified seats in PostgreSQL.
   */
  async acquireSeatHold(
    showtimeId: string,
    seatIds: string[]
  ): Promise<{ success: boolean; expiresAt?: string; expiresInSeconds?: number; error?: string }> {
    if (!isSupabaseConfigured) {
      // Frontend mock fallback
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return { success: true, expiresAt, expiresInSeconds: 300 };
    }

    try {
      const { data, error } = await supabase.rpc('acquire_seat_hold', {
        p_showtime_id: showtimeId,
        p_seat_ids: seatIds,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: data?.success ?? true,
        expiresAt: data?.expires_at,
        expiresInSeconds: data?.expires_in_seconds || 300,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối khi giữ ghế' };
    }
  },

  /**
   * Releases seat holds owned by caller for this showtime.
   */
  async releaseSeatHold(showtimeId: string, seatIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured || seatIds.length === 0) return true;

    try {
      const { error } = await supabase.rpc('release_seat_hold', {
        p_showtime_id: showtimeId,
        p_seat_ids: seatIds,
      });
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Creates a reliable booking transaction on the database server.
   * Prices are computed entirely in PostgreSQL; client prices are ignored.
   */
  async createBooking(params: CreateBookingParams): Promise<BookingResponse> {
    if (!isSupabaseConfigured) {
      const fakeCode = 'CN-' + Math.floor(100000 + Math.random() * 900000);
      return {
        success: true,
        bookingId: 'mock-booking-' + Date.now(),
        bookingCode: fakeCode,
        totalAmount: 0,
        status: 'pending',
      };
    }

    try {
      const cleanIdempotency = params.idempotencyKey?.trim() || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const { data, error } = await supabase.rpc('create_booking_transaction', {
        p_showtime_id: params.showtimeId,
        p_seat_ids: params.seatIds,
        p_customer_name: params.customerName,
        p_customer_email: params.customerEmail,
        p_customer_phone: params.customerPhone,
        p_payment_method: params.paymentMethod || 'momo',
        p_idempotency_key: cleanIdempotency,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: data?.success ?? true,
        bookingId: data?.booking_id,
        bookingCode: data?.booking_code,
        totalAmount: Number(data?.total_amount),
        status: data?.status || 'pending',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi khởi tạo đơn vé' };
    }
  },

  /**
   * Confirms simulated payment, registers seats permanently, and generates QR tickets.
   */
  async confirmDemoPayment(
    bookingId: string,
    paymentMethod = 'momo'
  ): Promise<PaymentConfirmationResponse> {
    if (!isSupabaseConfigured) {
      const randomCode = 'CN-' + Math.floor(100000 + Math.random() * 900000);
      return {
        success: true,
        message: 'Thanh toán mô phỏng thành công!',
        bookingId,
        bookingCode: randomCode,
        transactionId: 'DEMO-TXN-LOCAL',
        status: 'confirmed',
        tickets: [],
      };
    }

    try {
      const { data, error } = await supabase.rpc('confirm_demo_payment', {
        p_booking_id: bookingId,
        p_payment_method: paymentMethod,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && data.success === false) {
        return {
          success: false,
          error: data.message || 'Thanh toán thất bại.',
          status: data.code,
        };
      }

      const tickets: TicketInfo[] = (data?.tickets || []).map((t: any) => ({
        id: t.ticket_id,
        ticketCode: t.ticket_code,
        qrToken: t.qr_token,
        seatNumber: t.seat_number,
        seatType: t.seat_type,
        status: t.status,
      }));

      return {
        success: data?.success ?? true,
        message: data?.message,
        bookingId: data?.booking_id,
        bookingCode: data?.booking_code,
        transactionId: data?.transaction_id,
        status: data?.status || 'confirmed',
        totalAmount: Number(data?.total_amount),
        paymentMethod: data?.payment_method,
        tickets,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi xác nhận thanh toán demo' };
    }
  },

  /**
   * QR check-in by token (Admin / Staff only)
   */
  async checkInTicket(qrToken: string): Promise<CheckInResult> {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        code: 'NOT_CONFIGURED',
        message: 'Supabase chưa được cấu hình để soát vé trực tuyến.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_in_ticket', {
        p_qr_token: qrToken,
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_ERROR',
          message: error.message,
        };
      }

      return data as CheckInResult;
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Lỗi kết nối khi soát vé.',
      };
    }
  },

  /**
   * Check-in by manual ticket code fallback (Admin / Staff only)
   */
  async checkInTicketByCode(ticketCode: string): Promise<CheckInResult> {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        code: 'NOT_CONFIGURED',
        message: 'Supabase chưa được cấu hình để soát vé trực tuyến.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_in_ticket_by_code', {
        p_ticket_code: ticketCode,
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_ERROR',
          message: error.message,
        };
      }

      return data as CheckInResult;
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Lỗi kết nối khi soát vé.',
      };
    }
  },

  /**
   * Loads the authenticated customer's booking history and issued tickets.
   */
  async getUserBookings(): Promise<UserBookingHistoryItem[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          created_at,
          total_amount,
          status,
          customer_name,
          showtimes:showtime_id (
            id,
            starts_at,
            ends_at,
            format,
            movies:movie_id (
              title,
              poster_url
            ),
            rooms:room_id (
              name,
              cinemas:cinema_id (
                name
              )
            )
          ),
          tickets (
            id,
            ticket_code,
            qr_token,
            status,
            checked_in_at,
            seats:seat_id (
              row_label,
              seat_number,
              seat_type
            )
          ),
          payments (
            payment_method,
            transaction_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((b: any) => {
        const startsAt = b.showtimes?.starts_at ? new Date(b.showtimes.starts_at) : new Date();
        const endsAt = b.showtimes?.ends_at ? new Date(b.showtimes.ends_at) : new Date();

        const showtimeDate = formatToVnDate(startsAt);
        const showtimeStart = formatToVnTime(startsAt);
        const showtimeEnd = formatToVnTime(endsAt);

        const tickets: TicketInfo[] = (b.tickets || []).map((t: any) => ({
          id: t.id,
          ticketCode: t.ticket_code,
          qrToken: t.qr_token,
          seatNumber: `${t.seats?.row_label || ''}${t.seats?.seat_number || ''}`,
          seatType: (t.seats?.seat_type || 'regular') as SeatType,
          status: t.status,
          checkedInAt: t.checked_in_at,
        }));

        const seats = tickets.map((t) => t.seatNumber);
        const payment = b.payments?.[0];

        return {
          id: b.id,
          bookingCode: b.booking_code,
          createdAt: new Date(b.created_at).toLocaleString('vi-VN'),
          totalAmount: Number(b.total_amount),
          status: b.status,
          customerName: b.customer_name || 'Khách hàng',
          movieTitle: b.showtimes?.movies?.title || 'Phim CINENOVA',
          moviePoster: b.showtimes?.movies?.poster_url || '',
          cinemaName: b.showtimes?.rooms?.cinemas?.name || 'CINENOVA Cinema',
          hallName: b.showtimes?.rooms?.name || 'Phòng Chiếu',
          showtimeDate,
          showtimeStart,
          showtimeEnd,
          showtimeFormat: b.showtimes?.format || '2D Digital',
          seats,
          tickets,
          payment: payment
            ? {
                paymentMethod: payment.payment_method,
                transactionId: payment.transaction_id,
                status: payment.status,
              }
            : undefined,
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Loads all bookings for the Admin dashboard using live database relations.
   */
  async getAdminBookings(): Promise<BookingRecord[]> {
    return adminService.getBookings();
  },

  /**
   * Subscribes to Supabase Realtime channel for seat holds and booked seats for a showtime.
   * Returns a cleanup unsubscribe function.
   */
  subscribeShowtimeSeats(showtimeId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured) return () => {};

    // Backup polling timer every 10 seconds to guard against websocket drop or RLS filtering
    const intervalTimer = setInterval(() => {
      onUpdate();
    }, 10000);

    try {
      const channel = supabase
        .channel(`showtime-seats-${showtimeId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seat_holds',
            filter: `showtime_id=eq.${showtimeId}`,
          },
          () => {
            onUpdate();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'showtime_seats',
            filter: `showtime_id=eq.${showtimeId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        clearInterval(intervalTimer);
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        clearInterval(intervalTimer);
      };
    }
  },
};

