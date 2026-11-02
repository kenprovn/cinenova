import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Ticket, Play, MapPin, Film, Sparkles, AlertCircle } from 'lucide-react';
import { MOCK_MOVIES, MOCK_SHOWTIMES, MOCK_CINEMAS, getBookingDates } from '../../data/mockData';
import { AgeBadge } from '../../components/common/Badge';
import { useBooking } from '../booking/BookingContext';
import { formatCurrency } from '../../lib/utils';
import { movieService } from '../../services/movieService';
import { showtimeService } from '../../services/showtimeService';
import { Movie, Showtime } from '../../types';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setMovie, setShowtimeAndCinema } = useBooking();

  const [movie, setMovieState] = useState<Movie | null>(() => MOCK_MOVIES.find((m) => m.id === id) || null);
  const [showtimes, setShowtimes] = useState<Showtime[]>(() => MOCK_SHOWTIMES.filter((st) => st.movieId === id));
  const dates = useMemo(() => getBookingDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]?.dateStr || '');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(MOCK_CINEMAS[0]?.id || '');
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    if (id) {
      movieService.getMovieById(id).then((m) => {
        if (m) setMovieState(m);
      });
      showtimeService.getShowtimes(id, selectedCinemaId).then((res) => {
        if (res.data.length > 0) setShowtimes(res.data);
      });
    }
  }, [id, selectedCinemaId]);

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Không tìm thấy thông tin phim</h2>
        <p className="text-sm text-cinetext-secondary">Phim này không tồn tại hoặc đã ngừng chiếu.</p>
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

  // Filter showtimes for this movie and selected cinema
  const movieShowtimes = showtimes.filter(
    (st) => st.movieId === movie.id && st.cinemaId === selectedCinemaId
  );

  const handleSelectShowtime = (st: typeof MOCK_SHOWTIMES[0]) => {
    const cinema = MOCK_CINEMAS.find((c) => c.id === st.cinemaId) || MOCK_CINEMAS[0];
    setMovie(movie);
    setShowtimeAndCinema(st, cinema);
    navigate(`/booking/${movie.id}/seats`);
  };

  const selectedCinema = MOCK_CINEMAS.find((c) => c.id === selectedCinemaId) || MOCK_CINEMAS[0];

  return (
    <div className="space-y-12 pb-24 overflow-x-hidden">
      {/* HERO BACKDROP BANNER */}
      <div className="relative w-full min-h-[420px] sm:min-h-[500px] flex items-end">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={movie.bannerUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        {/* Back Link */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Movie Header Info */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
            {/* Poster Card */}
            <div className="relative w-44 sm:w-56 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border-2 border-surface-border shadow-2xl bg-surface group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <AgeBadge rating={movie.ageRating} />
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-3.5 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs uppercase font-bold text-gold tracking-widest bg-gold/10 px-2.5 py-1 rounded border border-gold/30">
                  {movie.isNowShowing ? 'Đang Chiếu' : 'Sắp Khởi Chiếu'}
                </span>
                <span className="text-xs text-cinetext-secondary">
                  Khởi chiếu: {movie.releaseDate}
                </span>
              </div>

              <h1 className="heading-font text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                {movie.title}
              </h1>

              <p className="text-base text-cinetext-muted italic font-medium">
                {movie.originalTitle}
              </p>

              {/* Badges / Rating / Duration */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-cinetext-secondary pt-1">
                <div className="flex items-center gap-1.5 bg-surface-light px-3 py-1 rounded-lg border border-surface-border">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="font-bold text-white">{movie.rating}</span>
                  <span className="text-cinetext-muted text-xs">({movie.reviewCount} đánh giá)</span>
                </div>

                <div className="flex items-center gap-1 bg-surface-light px-3 py-1 rounded-lg border border-surface-border">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>{movie.duration} phút</span>
                </div>

                <div className="flex items-center gap-1 bg-surface-light px-3 py-1 rounded-lg border border-surface-border">
                  <Film className="w-4 h-4 text-primary" />
                  <span>{movie.genres.join(', ')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                <a
                  href="#showtimes"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all active:scale-95"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Chọn suất chiếu & Mua vé</span>
                </a>

                {movie.trailerUrl && (
                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className="px-5 py-3 rounded-xl bg-surface-light hover:bg-surface text-cinetext-primary text-xs sm:text-sm font-semibold flex items-center gap-2 border border-surface-border transition-colors"
                  >
                    <Play className="w-4 h-4 text-gold fill-gold" />
                    <span>Xem Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTIONS: SYNOPSIS & SHOWTIMES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Synopsis & Cast */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-surface-border pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Nội dung phim
            </h2>
            <p className="text-cinetext-secondary text-sm leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4 text-sm">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3">
              Thông tin chi tiết
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-cinetext-muted block text-xs">Đạo diễn</span>
                <span className="text-white font-medium">{movie.director}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block text-xs">Diễn viên chính</span>
                <span className="text-white font-medium">{movie.cast.join(', ')}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block text-xs">Thể loại</span>
                <span className="text-white font-medium">{movie.genres.join(', ')}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block text-xs">Phân loại khán giả</span>
                <div className="pt-1">
                  <AgeBadge rating={movie.ageRating} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Showtime Schedule Picker */}
        <div id="showtimes" className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
              <div>
                <h2 className="heading-font text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Lịch Chiếu & Đặt Vé
                </h2>
                <p className="text-xs text-cinetext-secondary mt-0.5">
                  Chọn rạp, ngày chiếu và khung giờ để đến bước chọn vị trí ghế
                </p>
              </div>

              {/* Cinema selector */}
              <select
                value={selectedCinemaId}
                onChange={(e) => setSelectedCinemaId(e.target.value)}
                className="bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-medium"
              >
                {MOCK_CINEMAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cinema Address Banner */}
            <div className="flex items-start gap-2 bg-surface-light/60 p-3 rounded-xl border border-surface-border text-xs text-cinetext-secondary">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{selectedCinema.address} • Hotline: {selectedCinema.phone}</span>
            </div>

            {/* Date Picker Bar */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-cinetext-muted uppercase tracking-wider">
                Chọn ngày chiếu:
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {dates.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-2.5 rounded-xl border text-center transition-all shrink-0 ${
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

            {/* Showtimes List */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-semibold text-cinetext-muted uppercase tracking-wider block">
                Suất chiếu có sẵn:
              </span>

              {movieShowtimes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {movieShowtimes.map((st) => (
                    <div
                      key={st.id}
                      className="group bg-surface-light hover:bg-surface-border/50 p-4 rounded-xl border border-surface-border hover:border-primary/60 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white group-hover:text-gold transition-colors">
                              {st.startTime}
                            </span>
                            <span className="text-xs text-cinetext-muted">~ {st.endTime}</span>
                          </div>
                          <p className="text-xs text-cinetext-secondary mt-1">{st.hallName}</p>
                        </div>
                        <span className="text-[11px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/40">
                          {st.format}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-surface-border/60">
                        <span className="text-xs text-gold font-semibold">
                          Từ {formatCurrency(st.priceRegular)}
                        </span>
                        <button
                          onClick={() => handleSelectShowtime(st)}
                          className="px-3 py-1.5 bg-primary group-hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Chọn ghế</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-surface-light rounded-xl border border-surface-border space-y-2">
                  <p className="text-sm text-cinetext-secondary">
                    Hiện chưa có lịch chiếu cho rạp này vào ngày đã chọn.
                  </p>
                  <p className="text-xs text-cinetext-muted">
                    Vui lòng chọn rạp khác hoặc ngày chiếu khác.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TRAILER MODAL */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-gold fill-gold" />
                Trailer: {movie.title}
              </h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-cinetext-muted hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              {movie.trailerUrl?.includes('youtube.com') ? (
                <iframe
                  src={movie.trailerUrl.replace('watch?v=', 'embed/')}
                  title={`Trailer ${movie.title}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-cinetext-muted">
                  Trailer không khả dụng.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
