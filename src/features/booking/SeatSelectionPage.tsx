import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { MOCK_MOVIES, MOCK_SHOWTIMES, MOCK_CINEMAS, generateMockSeats } from '../../data/mockData';
import { useBooking } from './BookingContext';
import { Seat } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AgeBadge } from '../../components/common/Badge';

export const SeatSelectionPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { bookingState, setMovie, setShowtimeAndCinema, toggleSeat, totalAmount } = useBooking();

  // Find or fallback movie and showtime
  const movie = bookingState.movie || MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0];
  const showtime = bookingState.showtime || MOCK_SHOWTIMES.find((st) => st.movieId === movie.id) || MOCK_SHOWTIMES[0];
  const cinema = bookingState.cinema || MOCK_CINEMAS.find((c) => c.id === showtime.cinemaId) || MOCK_CINEMAS[0];

  useEffect(() => {
    if (!bookingState.movie || !bookingState.showtime) {
      setMovie(movie);
      setShowtimeAndCinema(showtime, cinema);
    }
  }, [movie, showtime, cinema]);

  // Generate seats for this showtime
  const [seats] = useState<Seat[]>(() =>
    generateMockSeats(showtime.id, showtime.priceRegular, showtime.priceVip)
  );

  const [limitWarning, setLimitWarning] = useState(false);

  const selectedSeatIds = useMemo(
    () => new Set(bookingState.selectedSeats.map((s) => s.id)),
    [bookingState.selectedSeats]
  );

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'disabled') return;
    const success = toggleSeat(seat);
    if (!success) {
      setLimitWarning(true);
      setTimeout(() => setLimitWarning(false), 3000);
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Check seat appearance
  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeatIds.has(seat.id);

    if (seat.status === 'booked') {
      return 'bg-zinc-800 text-zinc-600 border-zinc-700/50 cursor-not-allowed opacity-50';
    }

    if (isSelected) {
      return 'bg-primary text-white border-primary-hover shadow-glow-primary scale-110 font-bold z-10';
    }

    switch (seat.type) {
      case 'vip':
        return 'bg-surface-light border-gold/50 text-gold hover:border-gold hover:bg-gold/10 hover:scale-105';
      case 'couple':
        return 'bg-surface-light border-pink-500/50 text-pink-400 hover:border-pink-500 hover:bg-pink-500/10 hover:scale-105';
      case 'regular':
      default:
        return 'bg-surface-light border-surface-border text-zinc-300 hover:border-zinc-400 hover:bg-surface-border hover:scale-105';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 lg:pb-12">
      {/* Top Breadcrumb & Step Info */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-cinetext-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Đổi suất chiếu</span>
        </button>
        <span className="text-xs text-cinetext-muted">Bước 2 / 3: Chọn Ghế</span>
      </div>

      {/* Warning Notice about Phase 1 Mock State */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Lưu ý nguyên mẫu Phase 1:</strong> Trạng thái ghế và các vị trí đã đặt đang được mô phỏng bằng dữ liệu TypeScript mẫu. Tính năng khóa ghế theo thời gian thực (Real-time seat locking) và chống đặt trùng sẽ được phát triển với cơ sở dữ liệu Supabase trong Phase 2.
        </p>
      </div>

      {limitWarning && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt vé.</span>
        </div>
      )}

      {/* Main Grid: Screen Area & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Interactive Seat Map */}
        <div className="lg:col-span-3 bg-surface p-4 sm:p-8 rounded-2xl border border-surface-border space-y-8 overflow-hidden">
          {/* Cinema & Showtime quick bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4 text-xs sm:text-sm">
            <div>
              <p className="font-bold text-white">{cinema.name}</p>
              <p className="text-cinetext-muted text-xs">{showtime.hallName} • {showtime.format}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gold">{showtime.startTime} – {showtime.endTime}</p>
              <p className="text-cinetext-muted text-xs">{showtime.date}</p>
            </div>
          </div>

          {/* Curved Projection Screen */}
          <div className="relative w-full max-w-2xl mx-auto pt-2 pb-6 text-center">
            {/* Screen Arc */}
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full glow-edge-red" />
            <div className="h-10 w-full bg-gradient-to-b from-primary/10 to-transparent blur-sm -mt-1" />
            <span className="text-[11px] uppercase tracking-widest text-cinetext-muted font-bold block -mt-4">
              MÀN HÌNH CHÍNH (SCREEN)
            </span>
          </div>

          {/* Seat Grid Layout */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[560px] max-w-2xl mx-auto space-y-2.5">
              {rows.map((rowLetter) => {
                const rowSeats = seats.filter((s) => s.row === rowLetter);
                return (
                  <div key={rowLetter} className="flex items-center justify-center gap-2">
                    {/* Row Letter Left */}
                    <span className="w-5 text-center text-xs font-bold text-cinetext-muted">
                      {rowLetter}
                    </span>

                    {/* Row Seats */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {rowSeats.map((seat, index) => {
                        // Insert an aisle gap between column 3 & 4 and column 9 & 10
                        const isAisleGap = index === 2 || index === 8;
                        return (
                          <React.Fragment key={seat.id}>
                            <button
                              onClick={() => handleSeatClick(seat)}
                              disabled={seat.status === 'booked'}
                              title={`Ghế ${seat.seatNumber} (${seat.type.toUpperCase()}) - ${formatCurrency(seat.price)}`}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm border text-[10px] sm:text-[11px] font-semibold flex items-center justify-center transition-all duration-150 ${getSeatClass(
                                seat
                              )}`}
                            >
                              {seat.col}
                            </button>
                            {isAisleGap && <div className="w-3 sm:w-4" />}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Row Letter Right */}
                    <span className="w-5 text-center text-xs font-bold text-cinetext-muted">
                      {rowLetter}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seat Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 border-t border-surface-border text-xs text-cinetext-secondary">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-surface-light border border-surface-border" />
              <span>Ghế thường ({formatCurrency(showtime.priceRegular)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-surface-light border border-gold text-gold" />
              <span>Ghế VIP ({formatCurrency(showtime.priceVip)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-surface-light border border-pink-500 text-pink-400" />
              <span>Ghế đôi Couple</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-primary border border-primary-hover shadow-glow-primary" />
              <span className="text-white font-medium">Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-zinc-800 border border-zinc-700 opacity-50" />
              <span>Đã đặt</span>
            </div>
          </div>
        </div>

        {/* Right: Booking Summary Sidebar (Desktop) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-surface-border space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              Thông Tin Vé
            </h2>

            {/* Movie Info */}
            <div className="flex gap-3">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 aspect-[2/3] object-cover rounded-lg border border-surface-border shrink-0"
              />
              <div className="space-y-1 text-xs">
                <AgeBadge rating={movie.ageRating} />
                <h3 className="font-bold text-white line-clamp-1">{movie.title}</h3>
                <p className="text-cinetext-muted">{showtime.format}</p>
                <p className="text-cinetext-secondary">{showtime.hallName}</p>
              </div>
            </div>

            {/* Showtime & Cinema Info */}
            <div className="bg-surface-light/60 p-3 rounded-xl border border-surface-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Rạp:</span>
                <span className="text-white font-medium text-right truncate max-w-[140px]">{cinema.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Suất chiếu:</span>
                <span className="text-gold font-bold">{showtime.startTime} • {showtime.date}</span>
              </div>
            </div>

            {/* Selected Seats List */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cinetext-muted">Ghế đã chọn:</span>
                <span className="text-white font-bold">
                  {bookingState.selectedSeats.length > 0
                    ? `${bookingState.selectedSeats.length} ghế`
                    : 'Chưa chọn ghế'}
                </span>
              </div>

              {bookingState.selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {bookingState.selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="bg-primary/20 text-white border border-primary/40 px-2 py-0.5 rounded text-xs font-semibold"
                    >
                      {s.seatNumber}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-cinetext-muted italic">
                  Vui lòng bấm chọn ghế trên sơ đồ
                </p>
              )}
            </div>

            {/* Total Price & Checkout button */}
            <div className="pt-4 border-t border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cinetext-secondary">Tổng tiền:</span>
                <span className="text-xl font-extrabold text-gold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={bookingState.selectedSeats.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  bookingState.selectedSeats.length > 0
                    ? 'bg-primary hover:bg-primary-hover text-white shadow-glow-primary active:scale-95'
                    : 'bg-surface-light text-cinetext-muted border border-surface-border cursor-not-allowed'
                }`}
              >
                <span>Tiếp tục thanh toán</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile Screen */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface/95 backdrop-blur-md border-t border-surface-border p-4 z-40 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-cinetext-muted">
              {bookingState.selectedSeats.length > 0
                ? `${bookingState.selectedSeats.map((s) => s.seatNumber).join(', ')}`
                : 'Chưa chọn ghế'}
            </p>
            <p className="text-lg font-bold text-gold">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            disabled={bookingState.selectedSeats.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              bookingState.selectedSeats.length > 0
                ? 'bg-primary text-white shadow-glow-primary active:scale-95'
                : 'bg-surface-light text-cinetext-muted cursor-not-allowed'
            }`}
          >
            <span>Thanh toán</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
