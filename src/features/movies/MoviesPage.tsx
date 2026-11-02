import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, Film } from 'lucide-react';
import { MOCK_MOVIES } from '../../data/mockData';
import { MovieCard } from '../../components/movies/MovieCard';

export const MoviesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'now' ? 'now' : 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'now' | 'soon'>(initialTab);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');

  // Extract unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    MOCK_MOVIES.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set);
  }, []);

  const filteredMovies = useMemo(() => {
    return MOCK_MOVIES.filter((movie) => {
      // Search query
      const matchQuery =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.originalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'now') matchStatus = movie.isNowShowing;
      if (statusFilter === 'soon') matchStatus = movie.isComingSoon;

      // Genre filter
      let matchGenre = true;
      if (selectedGenre !== 'all') {
        matchGenre = movie.genres.includes(selectedGenre);
      }

      // Age filter
      let matchAge = true;
      if (selectedAge !== 'all') {
        matchAge = movie.ageRating === selectedAge;
      }

      return matchQuery && matchStatus && matchGenre && matchAge;
    });
  }, [searchQuery, statusFilter, selectedGenre, selectedAge]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedGenre('all');
    setSelectedAge('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="heading-font text-3xl sm:text-4xl font-extrabold text-white">
          Danh Sách Phim
        </h1>
        <p className="text-sm text-cinetext-secondary">
          Khám phá danh sách phim bom tấn chiếu rạp với đầy đủ suất chiếu tại các cụm rạp CINENOVA
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-surface-border space-y-4">
        {/* Top line: Search and Status tabs */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phim theo tên, đạo diễn, tựa gốc..."
              className="w-full bg-surface-light border border-surface-border text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted transition-colors"
            />
          </div>

          {/* Status selector buttons */}
          <div className="flex items-center gap-1.5 bg-surface-light p-1 rounded-xl border border-surface-border self-start md:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Tất cả ({MOCK_MOVIES.length})
            </button>
            <button
              onClick={() => setStatusFilter('now')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'now'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Đang chiếu
            </button>
            <button
              onClick={() => setStatusFilter('soon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'soon'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Sắp chiếu
            </button>
          </div>
        </div>

        {/* Bottom line: Genre chips & Age selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-cinetext-muted font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Thể loại:
            </span>
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedGenre === 'all'
                  ? 'bg-gold/20 text-gold border-gold/40'
                  : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white'
              }`}
            >
              Tất cả
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedGenre === genre
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="bg-surface-light border border-surface-border text-cinetext-secondary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
            >
              <option value="all">Mọi độ tuổi</option>
              <option value="P">P (Mọi lứa tuổi)</option>
              <option value="T13">T13 (Từ 13 tuổi)</option>
              <option value="T16">T16 (Từ 16 tuổi)</option>
              <option value="T18">T18 (Từ 18 tuổi)</option>
            </select>

            {(searchQuery || statusFilter !== 'all' || selectedGenre !== 'all' || selectedAge !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-cinetext-muted hover:text-white p-1.5 rounded transition-colors"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-cinetext-muted">
        <span>Hiển thị <strong>{filteredMovies.length}</strong> phim phù hợp</span>
      </div>

      {/* Movie Grid or Empty State */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface rounded-2xl border border-surface-border space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-light border border-surface-border flex items-center justify-center mx-auto text-cinetext-muted">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Không tìm thấy phim phù hợp</h3>
            <p className="text-xs text-cinetext-secondary max-w-sm mx-auto">
              Không có bộ phim nào khớp với từ khóa hoặc điều kiện lọc hiện tại của bạn.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Xóa bộ lọc & thử lại
          </button>
        </div>
      )}
    </div>
  );
};
