import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, AlertCircle, Loader2, Film } from 'lucide-react';
import { MOCK_CINEMAS, getBookingDates } from '../../data/mockData';
import { AgeBadge } from '../../components/common/Badge';
import { useBooking } from './BookingContext';
import { formatCurrency } from '../../lib/utils';
import { normalizeGenre } from '../../lib/genreUtils';
import { movieService, resolveMovieId, UUID_REGEX } from '../../services/movieService';
import { showtimeService } from '../../services/showtimeService';
import { cinemaService, resolveCinemaId } from '../../services/cinemaService';
import { Movie, Showtime, Cinema } from '../../types';

export const ShowtimeSelectPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { selectShowtime } = useBooking();

  const [movie, setMovieState] = useState<Movie | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pastWarning, setPastWarning] = useState<string | null>(null);

  const dates = useMemo(() => getBookingDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]?.dateStr || '');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    if (!movieId) {
      setIsLoading(false);
      return;
    }

    const resolvedId = resolveMovieId(movieId);
    // If the URL movieId was legacy (e.g. 'm1'), replace the URL with canonical UUID
    if (resolvedId !== movieId && UUID_REGEX.test(resolvedId)) {
      navigate(`/booking/${resolvedId}`, { replace: true });
      return;
    }

    setIsLoading(true);

    Promise.all([
      movieService.getMovieById(resolvedId),
      cinemaService.getCinemas(),
      showtimeService.getShowtimes(resolvedId),
    ]).then(([mRes, cRes, sRes]) => {
      if (isCancelled) return;

      if (mRes) {
        setMovieState(mRes);
        if (mRes.id !== movieId && UUID_REGEX.test(mRes.id)) {
          navigate(`/booking/${mRes.id}`, { replace: true });
        }
      }

      if (cRes.data.length > 0) {
        setCinemas(cRes.data);
        setSelectedCinemaId((prev) => {
          if (prev && cRes.data.some((c) => c.id === prev)) return prev;
          return cRes.data[0].id;
        });
      } else {
        setCinemas(MOCK_CINEMAS);
        setSelectedCinemaId(MOCK_CINEMAS[0].id);
      }

      if (sRes.data.length > 0) {
        setShowtimes(sRes.data);
      } else {
        setShowtimes([]);
      }

      setIsLoading(false);
    }).catch((err) => {
      if (isCancelled) return;
      console.error('[ShowtimeSelectPage] Load error:', err);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [movieId, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-sm text-cinetext-secondary">Đang tải lịch chiếu phim...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Không tìm thấy thông tin phim</h2>
        <p className="text-sm text-cinetext-secondary">Mã phim không hợp lệ hoặc phim đã ngừng chiếu.</p>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách phim</span>
        </Link>
      </div>
    );
  }

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0] || MOCK_CINEMAS[0];

  // Get showtimes matching movie, cinema, AND selected date
  const availableShowtimes = showtimes.filter((st) => {
    const matchMovie = st.movieId === movie.id;
    const targetCinema = selectedCinemaId ? resolveCinemaId(selectedCinemaId) : '';
    const matchCinema = !selectedCinemaId || st.cinemaId === selectedCinemaId || st.cinemaId === targetCinema;
    const matchDate = !selectedDate || st.date === selectedDate;
    return matchMovie && matchCinema && matchDate;
  });

  const isShowtimePast = (st: Showtime): boolean => {
    if (st.startsAt) {
      return new Date(st.startsAt).getTime() <= Date.now();
    }
    return new Date(`${st.date}T${st.startTime}:00+07:00`).getTime() <= Date.now();
  };

  const handleSelectShowtime = (st: Showtime) => {
    if (isShowtimePast(st)) {
      setPastWarning(`Suất chiếu ${st.startTime} ngày ${st.date} đã bắt đầu hoặc đã qua thời gian mở bán vé. Vui lòng chọn một suất chiếu khác.`);
      return;
    }
    setPastWarning(null);
    const chosenCinema = cinemas.find((c) => c.id === st.cinemaId) || selectedCinema;
    selectShowtime(movie, st, chosenCinema);
    navigate(`/booking/${movie.id}/seats?showtimeId=${st.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-cinetext-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <span className="text-xs text-cinetext-muted">Bước 1 / 3: Chọn Suất Chiếu</span>
      </div>

      {/* Movie Summary Header */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-surface-border flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl border border-surface-border shrink-0"
        />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <AgeBadge rating={movie.ageRating} />
            <span className="text-xs text-gold font-bold">{movie.genres.map(normalizeGenre).join(', ')}</span>
          </div>
          <h1 className="heading-font text-xl sm:text-2xl font-bold text-white">
            {movie.title}
          </h1>
          <p className="text-xs text-cinetext-muted italic">{movie.originalTitle}</p>
          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-cinetext-secondary pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold" />
              {movie.duration} phút
            </span>
            <span>Khởi chiếu: {movie.releaseDate}</span>
          </div>
        </div>
      </div>

      {/* Guard if movie is NOT now showing (e.g. ended/library or coming_soon) */}
      {!movie.isNowShowing ? (
        <div className="bg-surface p-6 sm:p-10 rounded-2xl border border-surface-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto text-gold">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              {movie.isComingSoon ? 'Phim Sắp Khởi Chiếu' : 'Phim Thư Viện Điện Ảnh'}
            </h2>
            <p className="text-xs sm:text-sm text-cinetext-secondary max-w-md mx-auto">
              {movie.isComingSoon
                ? `Bộ phim "${movie.title}" hiện chưa mở bán vé trực tuyến. Quý khách vui lòng theo dõi lịch chiếu trong thời gian tới.`
                : `Bộ phim "${movie.title}" thuộc kho phim Thư viện Điện ảnh phục vụ tra cứu thông tin và trailer, hiện không mở bán vé thương mại.`}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/movies?tab=now"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary"
            >
              Xem các phim đang chiếu để đặt vé
            </Link>
            <Link
              to={`/movies/${movie.id}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-light hover:bg-surface text-cinetext-primary text-xs font-semibold border border-surface-border transition-colors"
            >
              Xem thông tin chi tiết phim
            </Link>
          </div>
        </div>
      ) : (
        /* Main Selection Area */
        <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-8">
        {/* Cinema Selection */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            1. Chọn Cụm Rạp
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cinemas.map((cinema) => {
              const isSelected = selectedCinemaId === cinema.id;
              return (
                <button
                  key={cinema.id}
                  onClick={() => setSelectedCinemaId(cinema.id)}
                  className={`p-4 rounded-xl border text-left transition-all touch-manipulation active:scale-[0.99] ${
                    isSelected
                      ? 'bg-surface-light border-primary shadow-glow-primary/30'
                      : 'bg-surface-light/40 border-surface-border hover:border-zinc-600'
                  }`}
                >
                  <p className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-white'}`}>
                    {cinema.name}
                  </p>
                  <p className="text-xs text-cinetext-muted line-clamp-1 mt-1">{cinema.address}</p>
                  <span className="inline-block mt-2 text-[10px] bg-surface px-2 py-0.5 rounded text-zinc-300">
                    {cinema.city}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            2. Chọn Ngày Xem
          </h2>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {dates.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] min-h-[58px] px-3 py-3 rounded-xl border text-center transition-all shrink-0 touch-manipulation ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-glow-primary scale-105'
                      : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white hover:border-zinc-600'
                  }`}
                >
                  <span className="text-[11px] font-medium">{d.dayOfWeek}</span>
                  <span className="text-sm font-bold mt-0.5">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Showtime List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              3. Chọn Khung Giờ Chiếu
            </h2>
            <span className="text-xs text-cinetext-muted">
              Ngày {selectedDate.split('-').reverse().join('/')}
            </span>
          </div>

          {pastWarning && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{pastWarning}</span>
            </div>
          )}

          {availableShowtimes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {availableShowtimes.map((st) => {
                const past = isShowtimePast(st);
                return (
                  <div
                    key={st.id}
                    onClick={() => handleSelectShowtime(st)}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      past
                        ? 'bg-surface-light/30 border-surface-border/40 opacity-55 cursor-not-allowed'
                        : 'group cursor-pointer bg-surface-light hover:bg-surface-border/50 border-surface-border hover:border-primary shadow-sm hover:shadow-glow-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${past ? 'text-zinc-500 line-through' : 'text-white group-hover:text-gold transition-colors'}`}>
                            {st.startTime}
                          </span>
                          {past && (
                            <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                              Đã bắt đầu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-cinetext-muted mt-0.5">{st.hallName}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        past
                          ? 'bg-zinc-800/40 text-zinc-500 border-zinc-700/40'
                          : 'bg-primary/20 text-primary border-primary/40'
                      }`}>
                        {st.format}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-xs">
                      <span className={past ? 'text-zinc-500' : 'text-gold font-semibold'}>
                        {formatCurrency(st.priceRegular)}
                      </span>
                      {past ? (
                        <span className="text-zinc-500 font-medium text-[11px]">
                          Ngừng nhận vé
                        </span>
                      ) : (
                        <span className="text-cinetext-primary flex items-center gap-1 group-hover:text-white font-medium">
                          <span>Chọn ghế</span>
                          <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-light rounded-xl border border-surface-border space-y-2">
              <p className="text-sm text-cinetext-secondary">
                Không tìm thấy suất chiếu nào cho rạp và ngày đã chọn ({selectedDate.split('-').reverse().join('/')}).
              </p>
              <p className="text-xs text-cinetext-muted">
                Bạn có thể thử chọn ngày hoặc cụm rạp khác ở các mục phía trên.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
