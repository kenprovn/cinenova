import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Star, Sparkles, ChevronRight, Clapperboard, Award } from 'lucide-react';
import { MOCK_MOVIES } from '../../data/mockData';
import { MovieCard } from '../../components/movies/MovieCard';
import { AgeBadge } from '../../components/common/Badge';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'now' | 'soon'>('now');

  // Prominent hero movie
  const heroMovie = MOCK_MOVIES.find((m) => m.isFeatured) || MOCK_MOVIES[0];
  const nowShowingMovies = MOCK_MOVIES.filter((m) => m.isNowShowing);
  const comingSoonMovies = MOCK_MOVIES.filter((m) => m.isComingSoon);

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
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate(`/booking/${heroMovie.id}`)}
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all duration-200 active:scale-95"
              >
                <Ticket className="w-5 h-5" />
                <span>Đặt vé ngay</span>
              </button>

              <Link
                to={`/movies/${heroMovie.id}`}
                className="px-5 py-3.5 rounded-xl bg-surface-light/80 hover:bg-surface-light text-cinetext-primary font-semibold text-sm border border-surface-border flex items-center gap-2 transition-all backdrop-blur-md"
              >
                <Clapperboard className="w-4 h-4 text-gold" />
                <span>Thông tin phim</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BOOKING BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl shadow-2xl border border-surface-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Đặt vé nhanh</h3>
                <p className="text-xs text-cinetext-secondary">Chọn phim và suất chiếu nhanh trong 1 phút</p>
              </div>
            </div>

            {/* Quick dropdown simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-3/4">
              <select
                onChange={(e) => {
                  if (e.target.value) navigate(`/booking/${e.target.value}`);
                }}
                className="bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                defaultValue=""
              >
                <option value="" disabled>1. Chọn Phim...</option>
                {nowShowingMovies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>

              <select
                className="bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                defaultValue="c1"
              >
                <option value="c1">CINENOVA Landmark Sài Gòn</option>
                <option value="c2">CINENOVA Tây Hồ Hà Nội</option>
                <option value="c3">CINENOVA Sông Hàn Đà Nẵng</option>
              </select>

              <button
                onClick={() => navigate('/movies')}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm rounded-lg py-2.5 px-4 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Xem lịch chiếu</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOVIES TABS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
              Khám Phá Phim
            </h2>
            <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
              Những siêu phẩm điện ảnh đỉnh cao chuẩn âm thanh và hình ảnh quốc tế
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-surface-border self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('now')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'now'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Đang Chiếu ({nowShowingMovies.length})
            </button>
            <button
              onClick={() => setActiveTab('soon')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'soon'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Sắp Chiếu ({comingSoonMovies.length})
            </button>
          </div>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {(activeTab === 'now' ? nowShowingMovies : comingSoonMovies).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
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
              Tất cả các rạp trong hệ thống CINENOVA đều được trang bị hệ thống màn chiếu khổng lồ IMAX Laser với độ phân giải siêu nét, âm thanh vòm Dolby Atmos 360 độ và ghế ngồi bọc da cao cấp điều chỉnh độ ngả lưng.
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
