export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18' | 'C';

export type UserRole = 'customer' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  slug: string;
  posterUrl: string;
  bannerUrl: string;
  trailerUrl?: string;
  duration: number; // in minutes
  releaseDate: string;
  ageRating: AgeRating;
  genres: string[];
  director: string;
  cast: string[];
  synopsis: string;
  rating: number; // e.g. 8.8 / 10
  reviewCount: number;
  isNowShowing: boolean;
  isComingSoon: boolean;
  isFeatured?: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface Room {
  id: string;
  cinemaId: string;
  name: string;
  roomType: 'standard' | 'imax_laser' | 'deluxe' | 'vip';
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export type SeatType = 'regular' | 'vip' | 'couple';
export type SeatStatus = 'available' | 'booked' | 'selected' | 'disabled' | 'held';

export interface Seat {
  id: string;
  row: string;
  col: number;
  seatNumber: string; // e.g., "A1", "F6"
  type: SeatType;
  status: SeatStatus;
  price: number;
  expiresAt?: string | null;
}

export interface TicketInfo {
  id: string;
  ticketCode: string;
  qrToken: string;
  seatNumber: string;
  seatType: SeatType;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  checkedInAt?: string;
}

export interface CheckInResult {
  success: boolean;
  code: string;
  message: string;
  ticket?: {
    ticket_code: string;
    booking_code: string;
    customer_name?: string;
    customer_phone?: string;
    movie_title: string;
    movie_poster?: string;
    cinema_name: string;
    hall_name: string;
    seat_number: string;
    seat_type?: string;
    format?: string;
    starts_at?: string;
    checked_in_at?: string;
  };
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  hallName: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endTime: string;
  format: '2D Digital' | '3D' | 'IMAX Laser';
  priceRegular: number;
  priceVip: number;
  startsAt?: string;
  endsAt?: string;
}

export interface BookingCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface SelectedSeatInfo {
  id: string;
  seatNumber: string;
  row: string;
  type: SeatType;
  price: number;
}

export interface BookingState {
  movie: Movie | null;
  showtime: Showtime | null;
  cinema: Cinema | null;
  selectedSeats: SelectedSeatInfo[];
  customer: BookingCustomer;
  paymentMethod: string;
  holdExpiresAt?: string | null;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  hallName: string;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'expired';
  createdAt: string;
  ticketCount?: number;
  tickets?: {
    id: string;
    ticketCode: string;
    seatNumber: string;
    status: string;
  }[];
}

export interface AdminStats {
  totalBookings: number;
  totalConfirmedBookings: number;
  totalTicketsSold: number;
  totalDemoRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  todayTickets: number;
  occupancyRate: number;
  growthRate: number;
  bookingsByStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
    expired: number;
  };
  paymentMethodStats: {
    method: string;
    label: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  recentBookings: BookingRecord[];
  revenueByDay: { day: string; date: string; revenue: number; tickets: number }[];
  popularMovies: { title: string; tickets: number; revenue: number; percentage: number }[];
}
