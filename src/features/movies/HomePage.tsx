import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clapperboard,
  Award,
  Database,
} from 'lucide-react';
import { MOCK_MOVIES, MOCK_CINEMAS } from '../../data/mockData';
import { MovieCard } from '../../components/movies/MovieCard';
import { AgeBadge } from '../../components/common/Badge';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import { Movie, Cinema } from '../../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'now' | 'soon'>('now');
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [selectedQuickMovie, setSelectedQuickMovie] = useState<string>('');
  const [selectedQuickCinema, setSelectedQuickCinema] = useState<string>('');
  const [isFromDb, setIsFromDb] = useState(false);

  // Carousel ref and scroll states
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let isMounted = true;
    movieService.getMovies().then((res) => {
      if (isMounted && res.data.length > 0) {
        setMovies(res.data);
        setIsFromDb(res.isFromDb);
      }
    });
    cinemaService.getCinemas().then((res) => {
      if (isMounted && res.data.length > 0) {
        setCinemas(res.data);
        setSelectedQuickCinema(res.data[0].id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Prominent hero movie
  const heroMovie = movies.find((m) => m.isFeatured) || movies[0] || MOCK_MOVIES[0];
  const nowShowingMovies = movies.filter((m) => m.isNowShowing);
  const comingSoonMovies = movies.filter((m) => m.isComingSoon);
  const currentTabMovies = activeTab === 'now' ? nowShowingMovies : comingSoonMovies;

  const updateCarouselState = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollAmount = container.clientWidth * 0.82;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    const timer = setTimeout(updateCarouselState, 60);
    return () => clearTimeout(timer);
  }, [activeTab, currentTabMovies.length, updateCarouselState]);

  useEffect(() => {
    window.addEventListener('resize', updateCarouselState);
    return () => window.removeEventListener('resize', updateCarouselState);
  }, [updateCarouselState]);

  const handleQuickBook = () => {
    if (selectedQuickMovie) {
      navigate(`/booking/${selectedQuickMovie}`);
    } else {
      navigate('/movies');
    }
  };

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden">
      {/* HERO BANNER SECTION */}
      <section className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Depth Gradients */}
        <div className="absolute inset-0">
          <img
            src={heroMovie.bannerUrl}
            alt={heroMovie.title}
            className="w-full h-full object-cover object-center scale-105 transform animate-pulse-slow"
          />
          {/* Multi-layered cinematic gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full z-10">
          <div className="max-w-2xl space-y-5">
            {/* Tagline & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-primary/90 text-white font-bold text-xs uppercase px-3 py-1 rounded-full border border-primary/50 tracking-wider flex items-center gap-1 shadow-glow-primary">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Phim Bom Tấn Đang Chiếu
              </span>
              <AgeBadge rating={heroMovie.ageRating} />
              <span className="text-gold flex items-center gap-1 text-sm font-semibold bg-black/60 px-2.5 py-1 rounded border border-gold/30">
                <Star className="w-4 h-4 fill-gold text-gold" />
                {heroMovie.rating} / 10
              </span>
              {isFromDb && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Live Supabase
                </span>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="heading-font text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                {heroMovie.title}
              </h1>
              <p className="text-sm sm:text-base text-gold/90 font-medium tracking-wide">
                {heroMovie.originalTitle} • {heroMovie.genres.join(', ')}
              </p>
            </div>

            {/* Synopsis */}
            <p className="text-cinetext-secondary text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-xl">
              {heroMovie.synopsis}
            </p>

            {/* Director & Cast */}
            <div className="text-xs text-cinetext-muted space-y-1 pt-1">
              <p>
                <strong className="text-white">Đạo diễn:</strong> {heroMovie.director}
              </p>
              <p>
                <strong className="text-white">Diễn viên:</strong> {heroMovie.cast.join(', ')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 sm:pt-4 w-full sm:w-auto">
              <button
                onClick={() => navigate(`/booking/${heroMovie.id}`)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-primary transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <Ticket className="w-5 h-5" />
                <span>Đặt vé ngay</span>
              </button>

              <Link
                to={`/movies/${heroMovie.id}`}
                className="w-full sm:w-auto min-h-[44px] px-5 py-3.5 rounded-xl bg-surface-light/80 hover:bg-surface-light text-cinetext-primary font-semibold text-sm border border-surface-border flex items-center justify-center gap-2 transition-all backdrop-blur-md active:scale-95 touch-manipulation"
              >
                <Clapperboard className="w-4 h-4 text-gold" />
                <span>Thông tin phim</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BOOKING BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl shadow-2xl border border-surface-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Đặt vé nhanh</h3>
                <p className="text-xs text-cinetext-secondary">Chọn phim và rạp nhanh để xem lịch chiếu</p>
              </div>
            </div>

            {/* Quick dropdown simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-3/4">
              <select
                value={selectedQuickMovie}
                onChange={(e) => {
                  setSelectedQuickMovie(e.target.value);
                  if (e.target.value) navigate(`/booking/${e.target.value}`);
                }}
                className="bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-lg px-3 py-2.5 min-h-[44px] focus:outline-none focus:border-primary"
              >
                <option value="">1. Chọn Phim...</option>
                {nowShowingMovies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedQuickCinema}
                onChange={(e) => setSelectedQuickCinema(e.target.value)}
                className="bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-lg px-3 py-2.5 min-h-[44px] focus:outline-none focus:border-primary"
              >
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleQuickBook}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 px-4 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors active:scale-95 touch-manipulation"
              >
                <span>Xem lịch chiếu</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOVIES HORIZONTAL CAROUSEL SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
              Khám Phá Phim
            </h2>
            <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
              Những siêu phẩm điện ảnh đỉnh cao chuẩn âm thanh và hình ảnh quốc tế
            </p>
          </div>

          {/* Right Header Controls: Tabs & Carousel Nav Arrows */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {/* Tab buttons */}
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-surface-border">
              <button
                onClick={() => setActiveTab('now')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation ${
                  activeTab === 'now'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-cinetext-secondary hover:text-white'
                }`}
              >
                Đang Chiếu ({nowShowingMovies.length})
              </button>
              <button
                onClick={() => setActiveTab('soon')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation ${
                  activeTab === 'soon'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-cinetext-secondary hover:text-white'
                }`}
              >
                Sắp Chiếu ({comingSoonMovies.length})
              </button>
            </div>

            {/* Nav Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Xem phim trước"
                title="Xem phim trước"
                className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-cinetext-primary hover:text-white hover:border-gold disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 touch-manipulation shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Xem phim tiếp theo"
                title="Xem phim tiếp theo"
                className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-cinetext-primary hover:text-white hover:border-gold disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 touch-manipulation shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container with CSS Scroll Snap */}
        <div className="relative group">
          {/* Floating Left Arrow (Desktop xl) */}
          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              aria-label="Cuộn sang trái"
              className="hidden xl:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface/90 hover:bg-surface border border-surface-border hover:border-gold text-white items-center justify-center shadow-xl backdrop-blur-md z-20 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 text-gold" />
            </button>
          )}

          {/* Floating Right Arrow (Desktop xl) */}
          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              aria-label="Cuộn sang phải"
              className="hidden xl:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface/90 hover:bg-surface border border-surface-border hover:border-gold text-white items-center justify-center shadow-xl backdrop-blur-md z-20 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 text-gold" />
            </button>
          )}

          {/* Horizontal Track */}
          <div
            ref={carouselRef}
            onScroll={updateCarouselState}
            tabIndex={0}
            role="region"
            aria-label="Danh sách phim chọn lọc"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') handleScroll('left');
              if (e.key === 'ArrowRight') handleScroll('right');
            }}
            className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar touch-pan-x py-2 px-1 focus:outline-none focus:ring-1 focus:ring-gold/30 rounded-2xl"
          >
            {currentTabMovies.map((movie) => (
              <div
                key={movie.id}
                className="snap-start shrink-0 flex-none w-[68vw] min-w-[210px] max-w-[260px] sm:w-[calc(50%-12px)] sm:max-w-none md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] xl:w-[calc(20%-19.2px)]"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {/* Subtle Indicator / Helper */}
          {currentTabMovies.length > 5 && (
            <div className="flex items-center justify-between text-[11px] text-cinetext-muted px-2 pt-3">
              <span>
                Đang hiển thị <strong>{currentTabMovies.length}</strong> phim • Sử dụng mũi tên hoặc vuốt ngang để xem tiếp
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full transition-colors ${canScrollLeft ? 'bg-zinc-600' : 'bg-gold'}`} />
                <span className={`w-2 h-2 rounded-full transition-colors ${canScrollRight ? 'bg-gold' : 'bg-zinc-600'}`} />
              </div>
            </div>
          )}
        </div>

        {/* View all link */}
        <div className="text-center mt-10">
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-white text-sm font-semibold transition-all group"
          >
            <span>Xem toàn bộ danh sách phim</span>
            <ChevronRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* CINEMATIC EXPERIENCE HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-surface to-surface-light p-6 sm:p-10 rounded-2xl border border-surface-border relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Đẳng cấp trải nghiệm điện ảnh
            </span>
            <h2 className="heading-font text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Công Nghệ Chiếu Phim Hàng Đầu Thế Giới Tại CINENOVA
            </h2>
            <p className="text-cinetext-secondary text-sm leading-relaxed">
              Hệ thống cụm rạp CINENOVA mang đến trải nghiệm điện ảnh đa dạng với các phòng chiếu chuyên biệt: phòng chiếu IMAX Laser màn hình cực đại tại các rạp tiêu biểu, âm thanh vòm Dolby Atmos sống động và khu vực ghế VIP Recliner cao cấp (thông số kỹ thuật hiển thị chi tiết theo từng suất chiếu thực tế).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-background/60 p-4 rounded-xl border border-surface-border">
                <p className="font-bold text-white text-sm">IMAX Laser</p>
                <p className="text-xs text-cinetext-muted mt-1">Hình ảnh sáng hơn, độ tương phản sâu và sắc nét hơn bao giờ hết.</p>
              </div>
              <div className="bg-background/60 p-4 rounded-xl border border-surface-border">
                <p className="font-bold text-white text-sm">Dolby Atmos</p>
                <p className="text-xs text-cinetext-muted mt-1">Âm thanh đa chiều sống động chuyển động quanh người xem.</p>
              </div>
              <div className="bg-background/60 p-4 rounded-xl border border-surface-border">
                <p className="font-bold text-white text-sm">VIP Recliner</p>
                <p className="text-xs text-cinetext-muted mt-1">Ghế da tự động cao cấp, sạc không dây và phục vụ tại chỗ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
