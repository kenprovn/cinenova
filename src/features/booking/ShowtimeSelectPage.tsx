import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { MOCK_MOVIES, MOCK_SHOWTIMES, MOCK_CINEMAS, getBookingDates } from '../../data/mockData';
import { AgeBadge } from '../../components/common/Badge';
import { useBooking } from './BookingContext';
import { formatCurrency } from '../../lib/utils';
import { movieService } from '../../services/movieService';
import { showtimeService } from '../../services/showtimeService';
import { cinemaService } from '../../services/cinemaService';
import { Movie, Showtime, Cinema } from '../../types';

export const ShowtimeSelectPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { setMovie, setShowtimeAndCinema } = useBooking();

  const [movie, setMovieState] = useState<Movie | null>(() => MOCK_MOVIES.find((m) => m.id === movieId) || null);
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [showtimes, setShowtimes] = useState<Showtime[]>(MOCK_SHOWTIMES);

  const dates = useMemo(() => getBookingDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]?.dateStr || '');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0]?.id || '');

  useEffect(() => {
    if (movieId) {
      movieService.getMovieById(movieId).then((m) => {
        if (m) setMovieState(m);
      });
      cinemaService.getCinemas().then((res) => {
        if (res.data.length > 0) {
          setCinemas(res.data);
          setSelectedCinemaId(res.data[0].id);
        }
      });
      showtimeService.getShowtimes(movieId).then((res) => {
        if (res.data.length > 0) setShowtimes(res.data);
      });
    }
  }, [movieId]);

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Không tìm thấy thông tin phim</h2>
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

  // Get showtimes matching movie & cinema
  const availableShowtimes = showtimes.filter(
    (st) => st.movieId === movie.id && st.cinemaId === selectedCinemaId
  );

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0] || MOCK_CINEMAS[0];

  const handleSelectShowtime = (st: typeof MOCK_SHOWTIMES[0]) => {
    setMovie(movie);
    setShowtimeAndCinema(st, selectedCinema);
    navigate(`/booking/${movie.id}/seats`);
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
            <span className="text-xs text-gold font-bold">{movie.genres.join(', ')}</span>
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

      {/* Main Selection Area */}
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
                  className={`p-4 rounded-xl border text-left transition-all ${
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
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {dates.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] px-3 py-3 rounded-xl border text-center transition-all shrink-0 ${
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
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            3. Chọn Khung Giờ Chiếu
          </h2>

          {availableShowtimes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {availableShowtimes.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleSelectShowtime(st)}
                  className="group cursor-pointer bg-surface-light hover:bg-surface-border/50 p-4 rounded-xl border border-surface-border hover:border-primary transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                        {st.startTime}
                      </span>
                      <p className="text-xs text-cinetext-muted mt-0.5">{st.hallName}</p>
                    </div>
                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/40">
                      {st.format}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-xs">
                    <span className="text-gold font-semibold">
                      {formatCurrency(st.priceRegular)}
                    </span>
                    <span className="text-cinetext-primary flex items-center gap-1 group-hover:text-white font-medium">
                      <span>Chọn ghế</span>
                      <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-light rounded-xl border border-surface-border space-y-2">
              <p className="text-sm text-cinetext-secondary">
                Không tìm thấy suất chiếu nào cho rạp và ngày đã chọn.
              </p>
              <p className="text-xs text-cinetext-muted">
                Bạn có thể thử chọn ngày hoặc rạp chiếu khác ở phía trên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
