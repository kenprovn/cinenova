import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  AlertCircle,
  ChevronRight,
  Clock,
  Sparkles,
  Database,
  RefreshCw,
  Lock,
  Loader2
} from 'lucide-react';
import { MOCK_MOVIES, MOCK_CINEMAS } from '../../data/mockData';
import { useBooking } from './BookingContext';
import { useAuth } from '../auth/AuthContext';
import { Seat } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AgeBadge } from '../../components/common/Badge';
import { bookingService } from '../../services/bookingService';
import { showtimeService } from '../../services/showtimeService';
import { resolveMovieId, UUID_REGEX } from '../../services/movieService';

export const SeatSelectionPage: React.FC = () => {
  const { movieId, showtimeId: pathShowtimeId } = useParams<{ movieId: string; showtimeId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    bookingState,
    selectShowtime,
    setSelectedSeats,
    setHoldExpiresAt,
    clearSeats,
    totalAmount
  } = useBooking();

  const urlShowtimeId = pathShowtimeId || searchParams.get('showtimeId');
  const targetShowtimeId = urlShowtimeId || bookingState.showtime?.id;

  const [isLoadingShowtime, setIsLoadingShowtime] = useState<boolean>(
    !bookingState.showtime || (!!urlShowtimeId && urlShowtimeId !== bookingState.showtime.id)
  );
  const [showtimeError, setShowtimeError] = useState<string | null>(null);

  // Sync / fetch showtime by ID
  useEffect(() => {
    let isCancelled = false;

    if (movieId) {
      const resolved = resolveMovieId(movieId);
      if (resolved !== movieId && UUID_REGEX.test(resolved)) {
        navigate({
          pathname: `/booking/${resolved}/seats`,
          search: window.location.search,
        }, { replace: true });
        return;
      }
    }

    if (!targetShowtimeId) {
      setIsLoadingShowtime(false);
      return;
    }

    // Keep URL query param in sync for bookmarking and F5 persistence
    if (!urlShowtimeId && targetShowtimeId) {
      navigate({ search: `?showtimeId=${targetShowtimeId}` }, { replace: true });
    }

    // If current in-memory showtime already matches targetShowtimeId, avoid re-fetch
    if (
      bookingState.showtime &&
      bookingState.showtime.id === targetShowtimeId &&
      bookingState.movie &&
      bookingState.cinema
    ) {
      setIsLoadingShowtime(false);
      return;
    }

    setIsLoadingShowtime(true);
    setShowtimeError(null);

    showtimeService.getShowtimeById(targetShowtimeId).then((res) => {
      if (isCancelled) return;
      setIsLoadingShowtime(false);

      if (res.data) {
        const movieObj = res.movie || bookingState.movie || MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0];
        const cinemaObj = res.cinema || bookingState.cinema || MOCK_CINEMAS[0];
        selectShowtime(movieObj, res.data, cinemaObj);
      } else {
        setShowtimeError(res.error || 'Không tìm thấy thông tin suất chiếu yêu cầu.');
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [targetShowtimeId, urlShowtimeId, bookingState.showtime?.id, movieId, navigate, selectShowtime]);

  const movie = bookingState.movie || MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0];
  const showtime = bookingState.showtime;
  const cinema = bookingState.cinema || MOCK_CINEMAS[0];

  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  // Remaining hold time in seconds (server-authoritative)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if this showtime has already started
  const isShowtimePast = useMemo(() => {
    if (!showtime) return false;
    if (showtime.startsAt) {
      return new Date(showtime.startsAt).getTime() <= Date.now();
    }
    return new Date(`${showtime.date}T${showtime.startTime}:00+07:00`).getTime() <= Date.now();
  }, [showtime]);

  // Load seats from PostgreSQL for current showtime
  const loadSeats = useCallback(async (isInitial = false) => {
    if (!showtime) return;
    if (isInitial) setIsLoadingSeats(true);
    const res = await bookingService.getShowtimeSeats(
      showtime.id,
      showtime.priceRegular,
      showtime.priceVip
    );
    setSeats(res.seats);
    setIsLiveDb(res.isLiveDb);
    if (isInitial) setIsLoadingSeats(false);
  }, [showtime?.id, showtime?.priceRegular, showtime?.priceVip]);

  useEffect(() => {
    if (!showtime) return;
    loadSeats(true);

    // Setup Supabase Realtime channel
    const unsubscribe = bookingService.subscribeShowtimeSeats(showtime.id, () => {
      loadSeats(false);
    });

    return () => {
      unsubscribe();
    };
  }, [showtime?.id, loadSeats]);

  // Handle countdown timer based on holdExpiresAt
  useEffect(() => {
    if (!bookingState.holdExpiresAt) {
      setRemainingSeconds(null);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      return;
    }

    const targetTime = new Date(bookingState.holdExpiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setHoldExpiresAt(null);
        clearSeats();
        setErrorMessage('Thời gian giữ ghế 5 phút đã hết hạn! Ghế đã được tự động mở lại.');
        loadSeats(false);
      }
    };

    updateTimer();
    holdTimerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [bookingState.holdExpiresAt, clearSeats, setHoldExpiresAt, loadSeats]);

  const selectedSeatIds = useMemo(
    () => new Set(bookingState.selectedSeats.map((s) => s.id)),
    [bookingState.selectedSeats]
  );

  // Click handler with atomic hold
  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'disabled' || seat.status === 'held') {
      return;
    }

    if (!showtime) return;

    if (isShowtimePast) {
      setErrorMessage('Suất chiếu này đã bắt đầu hoặc đã qua giờ mở bán vé. Vui lòng quay lại đổi suất chiếu khác.');
      return;
    }

    // Require login for holding seats
    if (!user) {
      setErrorMessage('Vui lòng đăng nhập tài khoản để thực hiện giữ và đặt ghế.');
      return;
    }

    setErrorMessage(null);

    const isAlreadySelected = selectedSeatIds.has(seat.id);
    let updatedSeats = [...bookingState.selectedSeats];

    if (isAlreadySelected) {
      updatedSeats = updatedSeats.filter((s) => s.id !== seat.id);
    } else {
      if (updatedSeats.length >= 8) {
        setLimitWarning(true);
        setTimeout(() => setLimitWarning(false), 3000);
        return;
      }
      updatedSeats.push({
        id: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        type: seat.type,
        price: seat.price,
      });
    }

    setIsHolding(true);

    if (updatedSeats.length === 0) {
      // Released all seats
      await bookingService.releaseSeatHold(showtime.id, [seat.id]);
      setSelectedSeats([]);
      setHoldExpiresAt(null);
      setIsHolding(false);
      loadSeats(false);
      return;
    }

    // Request atomic hold from PostgreSQL
    const res = await bookingService.acquireSeatHold(
      showtime.id,
      updatedSeats.map((s) => s.id)
    );

    setIsHolding(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Không thể giữ ghế. Ghế có thể vừa có người khác chọn.');
      // Refresh seat board
      loadSeats(false);
    } else {
      setSelectedSeats(updatedSeats);
      if (res.expiresAt) {
        setHoldExpiresAt(res.expiresAt);
      }
      loadSeats(false);
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Check seat appearance
  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeatIds.has(seat.id);

    if (seat.status === 'booked') {
      return 'bg-zinc-800 text-zinc-600 border-zinc-700/50 cursor-not-allowed opacity-50';
    }

    if (seat.status === 'held' && !isSelected) {
      return 'bg-amber-950/40 text-amber-500/80 border-amber-600/40 cursor-not-allowed border-dashed animate-pulse';
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

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Condition 1: Loading showtime
  if (isLoadingShowtime) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">Đang tải thông tin suất chiếu...</h2>
        <p className="text-xs text-cinetext-muted">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  // Condition 2: No showtime selected
  if (!targetShowtimeId || (!showtime && !isLoadingShowtime && !showtimeError)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Chưa chọn suất chiếu</h2>
        <p className="text-xs text-cinetext-secondary">
          Vui lòng quay lại danh sách suất chiếu để chọn ngày và giờ chiếu phù hợp trước khi chọn ghế.
        </p>
        <Link
          to={`/booking/${movieId || ''}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại chọn suất chiếu</span>
        </Link>
      </div>
    );
  }

  // Condition 3: Showtime load error
  if (showtimeError || !showtime) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lỗi nạp suất chiếu</h2>
        <p className="text-xs text-rose-300">{showtimeError || 'Suất chiếu không tồn tại.'}</p>
        <Link
          to={`/booking/${movieId || ''}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Chọn suất chiếu khác</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 lg:pb-12">
      {/* Top Breadcrumb & Step Info */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/booking/${movie.id}`)}
          className="flex items-center gap-2 text-xs font-semibold text-cinetext-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Đổi suất chiếu khác</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cinetext-muted">Bước 2 / 3: Chọn Ghế</span>
          {isLiveDb ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Database className="w-3 h-3" />
              <span>Realtime PostgreSQL</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>Chế độ mô phỏng</span>
            </span>
          )}
        </div>
      </div>

      {/* Warning: Showtime in the past */}
      {isShowtimePast && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Suất chiếu đã bắt đầu hoặc đã qua thời gian mở bán vé</p>
              <p className="text-xs text-rose-300">
                Suất chiếu lúc {showtime.startTime} ngày {showtime.date} ({showtime.hallName}) đã qua giờ bán vé. Vui lòng đổi sang suất chiếu tiếp theo.
              </p>
            </div>
          </div>
          <Link
            to={`/booking/${movie.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shrink-0 transition-colors shadow-glow-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Đổi suất chiếu khác</span>
          </Link>
        </div>
      )}

      {/* Countdown Timer Banner when seats are held */}
      {remainingSeconds !== null && remainingSeconds > 0 && (
        <div className="bg-gradient-to-r from-primary/20 via-surface to-surface border border-primary/50 rounded-xl p-3 sm:p-4 text-xs flex items-center justify-between gap-4 shadow-lg shadow-primary/10 animate-fade-in">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-xl bg-primary/30 border border-primary/60 flex items-center justify-center text-primary-hover shrink-0">
              <Clock className="w-5 h-5 text-gold animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ghế đang được giữ tạm thời</p>
              <p className="text-cinetext-muted text-xs">
                Ghế của bạn được bảo lưu trong 5 phút. Vui lòng hoàn tất thanh toán trước khi hết hạn.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-light border border-surface-border px-3.5 py-1.5 rounded-xl font-mono text-base font-extrabold text-gold shadow-inner shrink-0">
            <span>{formatCountdown(remainingSeconds)}</span>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 p-4 rounded-xl text-xs font-semibold flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadSeats(false)}
            className="text-xs text-white underline hover:no-underline shrink-0"
          >
            Tải lại sơ đồ
          </button>
        </div>
      )}

      {limitWarning && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt vé.</span>
        </div>
      )}

      {/* Main Grid: Screen Area & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Interactive Seat Map */}
        <div className="lg:col-span-3 bg-surface p-4 sm:p-8 rounded-2xl border border-surface-border space-y-8 overflow-hidden relative">
          {/* Cinema & Showtime quick bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4 text-xs sm:text-sm">
            <div>
              <p className="font-bold text-white">{cinema.name}</p>
              <p className="text-cinetext-muted text-xs">{showtime.hallName} • {showtime.format}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadSeats(false)}
                title="Làm mới trạng thái ghế"
                className="p-1.5 rounded-lg bg-surface-light border border-surface-border text-cinetext-secondary hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="text-right">
                <p className="font-bold text-gold">{showtime.startTime} – {showtime.endTime}</p>
                <p className="text-cinetext-muted text-xs">Ngày {showtime.date.split('-').reverse().join('/')}</p>
              </div>
            </div>
          </div>

          {/* Curved Projection Screen */}
          <div className="relative w-full max-w-2xl mx-auto pt-2 pb-6 text-center">
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full glow-edge-red" />
            <div className="h-10 w-full bg-gradient-to-b from-primary/10 to-transparent blur-sm -mt-1" />
            <span className="text-[11px] uppercase tracking-widest text-cinetext-muted font-bold block -mt-4">
              MÀN HÌNH CHÍNH (SCREEN)
            </span>
          </div>

          {/* Seat Grid Layout */}
          <div className="overflow-x-auto pb-4">
            {isLoadingSeats ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-cinetext-muted">Đang tải sơ đồ ghế phòng chiếu...</p>
              </div>
            ) : (
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
                          // Insert aisle gap between column 3 & 4 and column 9 & 10
                          const isAisleGap = index === 2 || index === 8;
                          const isHeld = seat.status === 'held' && !selectedSeatIds.has(seat.id);

                          return (
                            <React.Fragment key={seat.id}>
                              <button
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status === 'booked' || seat.status === 'disabled' || isHeld || isHolding}
                                title={
                                  isHeld
                                    ? `Ghế ${seat.seatNumber} đang có khách hàng khác giữ tạm thời`
                                    : seat.status === 'booked'
                                    ? `Ghế ${seat.seatNumber} đã được bán`
                                    : `Ghế ${seat.seatNumber} (${seat.type.toUpperCase()}) - ${formatCurrency(seat.price)}`
                                }
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm border text-[10px] sm:text-[11px] font-semibold flex items-center justify-center transition-all duration-150 ${getSeatClass(
                                  seat
                                )}`}
                              >
                                {isHeld ? <Lock className="w-3 h-3 text-amber-500" /> : seat.col}
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
            )}
          </div>

          {/* Seat Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-4 border-t border-surface-border text-xs text-cinetext-secondary">
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
              <div className="w-5 h-5 rounded-t-md bg-amber-950/40 border border-amber-600/40 border-dashed" />
              <span className="text-amber-400">Đang giữ (5p)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t-md bg-zinc-800 border border-zinc-700 opacity-50" />
              <span>Đã bán</span>
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
