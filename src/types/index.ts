export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18' | 'C';

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

export type SeatType = 'regular' | 'vip' | 'couple';
export type SeatStatus = 'available' | 'booked' | 'selected' | 'disabled';

export interface Seat {
  id: string;
  row: string;
  col: number;
  seatNumber: string; // e.g., "A1", "F6"
  type: SeatType;
  status: SeatStatus;
  price: number;
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
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface AdminStats {
  todayRevenue: number;
  monthlyRevenue: number;
  todayTickets: number;
  occupancyRate: number;
  growthRate: number;
  recentBookings: BookingRecord[];
  revenueByDay: { day: string; revenue: number; tickets: number }[];
  popularMovies: { title: string; tickets: number; revenue: number; percentage: number }[];
}

