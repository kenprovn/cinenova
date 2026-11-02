import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  Film,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { MOCK_MOVIES } from '../../data/mockData';
import { MovieCard } from '../../components/movies/MovieCard';
import { movieService } from '../../services/movieService';
import { Movie } from '../../types';
import { normalizeGenre, movieMatchesGenre } from '../../lib/genreUtils';

const PAGE_SIZE = 25; // Exactly 5 columns x 5 rows on desktop (25 movies/page)

function getPaginationRange(current: number, total: number): (number | 'ellipsis-left' | 'ellipsis-right')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis-left', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total];
}

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gridSectionRef = useRef<HTMLDivElement>(null);

  // Read URL query params
  const rawTab = searchParams.get('tab');
  const statusFilter: 'all' | 'now' | 'soon' | 'library' =
    rawTab === 'now' || rawTab === 'soon' || rawTab === 'library' ? rawTab : 'all';

  const urlQuery = searchParams.get('q') || '';
  const selectedGenre = searchParams.get('genre') || 'all';
  const selectedAge = searchParams.get('age') || 'all';
  const rawSort = searchParams.get('sort');
  const sortBy: 'popular' | 'rating' | 'release' | 'title' =
    rawSort === 'rating' || rawSort === 'release' || rawSort === 'title' ? rawSort : 'popular';

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // Local search input for instantaneous typing responsiveness
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [moviesList, setMoviesList] = useState<Movie[]>(MOCK_MOVIES);

  // Fetch movies from DB on mount
  useEffect(() => {
    let isMounted = true;
    movieService.getMovies().then((res) => {
      if (isMounted && res.data.length > 0) {
        setMoviesList(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep searchInput in sync when URL query changes (e.g. Browser Back / Forward)
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  // Debounce search input to URL query params
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlQuery) {
        updateParams({ q: searchInput.trim() || undefined }, true);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Helper to update query parameters in URL
  const updateParams = (newParams: Record<string, string | undefined>, resetPage: boolean = true) => {
    const next = new URLSearchParams(searchParams);
    if (resetPage) {
      next.delete('page');
    }
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === 'all' || val === 'popular' || (key === 'page' && val === '1')) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next);
  };

  // Scroll to grid top smoothly
  const scrollToGridTop = () => {
    if (gridSectionRef.current) {
      const navOffset = 90;
      const elementPosition = gridSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Status counts
  const counts = useMemo(() => {
    let now = 0;
    let soon = 0;
    let library = 0;
    for (const m of moviesList) {
      if (m.isNowShowing) now++;
      else if (m.isComingSoon) soon++;
      else if (m.isEnded) library++;
    }
    return {
      all: moviesList.length,
      now,
      soon,
      library,
    };
  }, [moviesList]);

  // Extract unique normalized genres sorted by frequency
  const allGenres = useMemo(() => {
    const freqMap: Record<string, number> = {};
    moviesList.forEach((m) => {
      (m.genres || []).forEach((g) => {
        const norm = normalizeGenre(g);
        if (norm) {
          freqMap[norm] = (freqMap[norm] || 0) + 1;
        }
      });
    });
    return Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
  }, [moviesList]);

  // Filter and sort movies
  const sortedAndFilteredMovies = useMemo(() => {
    const list = moviesList.filter((movie) => {
      // Search query (diacritics-insensitive, English title, director)
      const q = urlQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.originalTitle.toLowerCase().includes(q) ||
        movie.director.toLowerCase().includes(q);

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'now') matchStatus = Boolean(movie.isNowShowing);
      else if (statusFilter === 'soon') matchStatus = Boolean(movie.isComingSoon);
      else if (statusFilter === 'library') matchStatus = Boolean(movie.isEnded);

      // Canonical Genre filter
      const matchGenre = movieMatchesGenre(movie.genres, selectedGenre);

      // Age filter
      let matchAge = true;
      if (selectedAge !== 'all') {
        matchAge = movie.ageRating === selectedAge;
      }

      return matchQuery && matchStatus && matchGenre && matchAge;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rB !== rA) return rB - rA;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      if (sortBy === 'release') {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'vi');
      }
      // 'popular' default:
      // Priority 1: now_showing / featured
      if (a.isNowShowing && !b.isNowShowing) return -1;
      if (!a.isNowShowing && b.isNowShowing) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Priority 2: rating
      const rA = a.rating || 0;
      const rB = b.rating || 0;
      if (rB !== rA) return rB - rA;
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }, [moviesList, urlQuery, statusFilter, selectedGenre, selectedAge, sortBy]);

  // Pagination calculations
  const totalItems = sortedAndFilteredMovies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  // Render ONLY 25 cards for the active page
  const displayedMovies = useMemo(() => {
    return sortedAndFilteredMovies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedAndFilteredMovies, startIndex]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    updateParams({ page: newPage === 1 ? undefined : String(newPage) }, false);
    scrollToGridTop();
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
    scrollToGridTop();
  };

  const paginationItems = useMemo(() => {
    return getPaginationRange(currentPage, totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="heading-font text-3xl sm:text-4xl font-extrabold text-white">
          {statusFilter === 'library'
            ? 'Thư Viện Điện Ảnh CINENOVA'
            : statusFilter === 'now'
            ? 'Phim Đang Chiếu'
            : statusFilter === 'soon'
            ? 'Phim Sắp Chiếu'
            : 'Danh Sách Phim'}
        </h1>
        <p className="text-sm text-cinetext-secondary">
          {statusFilter === 'library'
            ? 'Kho lưu trữ 480+ tác phẩm điện ảnh kinh điển và bom tấn thế giới để tra cứu thông tin, trailer và dàn diễn viên.'
            : 'Khám phá danh sách phim bom tấn chiếu rạp với đầy đủ suất chiếu tại các cụm rạp CINENOVA.'}
        </p>
      </div>

      {/* Filter, Search and Sort Bar */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-surface-border space-y-4 shadow-lg shadow-black/40">
        {/* Top line: Search and Status tabs */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm phim theo tên tiếng Việt, tựa gốc, đạo diễn..."
              className="w-full bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-xl pl-10 pr-9 py-2.5 min-h-[44px] focus:outline-none focus:border-primary placeholder:text-cinetext-muted transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateParams({ q: undefined }, true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cinetext-muted hover:text-white p-1 rounded-full"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status selector tabs */}
          <div className="flex items-center gap-1.5 bg-surface-light p-1 rounded-xl border border-surface-border w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => updateParams({ tab: undefined }, true)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-all touch-manipulation whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Tất cả ({counts.all})
            </button>
            <button
              onClick={() => updateParams({ tab: 'now' }, true)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-all touch-manipulation whitespace-nowrap ${
                statusFilter === 'now'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Đang chiếu ({counts.now})
            </button>
            <button
              onClick={() => updateParams({ tab: 'soon' }, true)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-all touch-manipulation whitespace-nowrap ${
                statusFilter === 'soon'
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              Sắp chiếu ({counts.soon})
            </button>
            <button
              onClick={() => updateParams({ tab: 'library' }, true)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-all touch-manipulation whitespace-nowrap flex items-center justify-center gap-1 ${
                statusFilter === 'library'
                  ? 'bg-gold text-slate-950 font-bold shadow'
                  : 'text-cinetext-secondary hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Thư viện ({counts.library})</span>
            </button>
          </div>
        </div>

        {/* Bottom line: Genre chips, Age selector & Sort selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pt-3 border-t border-surface-border/60">
          {/* Genre chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 sm:flex-wrap no-scrollbar">
            <span className="text-xs text-cinetext-muted font-medium flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-gold" />
              Thể loại:
            </span>
            <button
              onClick={() => updateParams({ genre: undefined }, true)}
              className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium border transition-colors shrink-0 touch-manipulation ${
                selectedGenre === 'all'
                  ? 'bg-gold/20 text-gold border-gold/40'
                  : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white'
              }`}
            >
              Tất cả
            </button>
            {allGenres.slice(0, 14).map((genre) => (
              <button
                key={genre}
                onClick={() => updateParams({ genre: selectedGenre === genre ? undefined : genre }, true)}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium border transition-colors shrink-0 touch-manipulation ${
                  selectedGenre === genre
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Right controls: Sorting & Age */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-surface-light border border-surface-border rounded-lg px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => updateParams({ sort: e.target.value === 'popular' ? undefined : e.target.value }, false)}
                className="bg-transparent text-cinetext-primary text-xs focus:outline-none cursor-pointer py-1 min-h-[32px]"
                title="Sắp xếp danh sách phim"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="rating">Điểm đánh giá cao</option>
                <option value="release">Mới phát hành</option>
                <option value="title">Tên phim A–Z</option>
              </select>
            </div>

            {/* Age Filter */}
            <select
              value={selectedAge}
              onChange={(e) => updateParams({ age: e.target.value === 'all' ? undefined : e.target.value }, true)}
              className="bg-surface-light border border-surface-border text-cinetext-secondary text-base sm:text-xs rounded-lg px-2.5 py-2 min-h-[38px] focus:outline-none focus:border-primary"
            >
              <option value="all">Mọi độ tuổi</option>
              <option value="P">P (Mọi lứa tuổi)</option>
              <option value="T13">T13 (Từ 13 tuổi)</option>
              <option value="T16">T16 (Từ 16 tuổi)</option>
              <option value="T18">T18 (Từ 18 tuổi)</option>
              <option value="UNRATED">TBC (Chưa phân loại)</option>
            </select>

            {(urlQuery || statusFilter !== 'all' || selectedGenre !== 'all' || selectedAge !== 'all' || sortBy !== 'popular') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-cinetext-muted hover:text-white p-2 rounded-lg bg-surface-light/60 hover:bg-surface-light border border-surface-border transition-colors shrink-0"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gold" />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header & Jump Bar */}
      <div ref={gridSectionRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-cinetext-muted px-1">
        <div>
          {totalItems > 0 ? (
            <span>
              Đang xem <strong>{startIndex + 1}</strong> – <strong>{Math.min(startIndex + PAGE_SIZE, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> phim (Trang {currentPage} / {totalPages})
            </span>
          ) : (
            <span>Không có phim phù hợp</span>
          )}
        </div>
        {statusFilter === 'library' && (
          <span className="text-[11px] text-zinc-400 italic">
            * Phim thư viện phục vụ tra cứu thông tin & trailer, không mở bán vé thương mại.
          </span>
        )}
      </div>

      {/* Movie Grid: Optimized 5 Columns on Large Desktop for broad, premium cinema cards */}
      {displayedMovies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Professional Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-black/30">
              {/* Pagination Info */}
              <div className="text-xs text-cinetext-secondary text-center sm:text-left">
                <span>
                  Trang <strong className="text-white font-bold">{currentPage}</strong> / <strong className="text-white font-bold">{totalPages}</strong> • 25 phim/trang
                </span>
              </div>

              {/* Page Buttons with Ellipsis */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-1">
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1}
                  className="p-2 min-h-[38px] min-w-[38px] rounded-lg border text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-light border-surface-border text-cinetext-secondary hover:text-white hover:border-zinc-500"
                  title="Về trang đầu tiên"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 min-h-[38px] rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-light border-surface-border text-cinetext-secondary hover:text-white hover:border-zinc-500"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden md:inline">Trước</span>
                </button>

                {/* Numbered Page Buttons with Ellipsis */}
                {paginationItems.map((item, idx) => {
                  if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                    return (
                      <span
                        key={`${item}-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-cinetext-muted font-bold select-none"
                      >
                        …
                      </span>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[38px] min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all touch-manipulation border ${
                        isActive
                          ? 'bg-primary text-white border-primary shadow-glow-primary scale-105'
                          : 'bg-surface-light text-cinetext-secondary border-surface-border hover:text-white hover:border-zinc-500'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 min-h-[38px] rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-light border-surface-border text-cinetext-secondary hover:text-white hover:border-zinc-500"
                  title="Trang kế tiếp"
                >
                  <span className="hidden md:inline">Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="p-2 min-h-[38px] min-w-[38px] rounded-lg border text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-light border-surface-border text-cinetext-secondary hover:text-white hover:border-zinc-500"
                  title="Đến trang cuối cùng"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Jump to Page Dropdown */}
              {totalPages > 3 && (
                <div className="flex items-center gap-2 text-xs text-cinetext-secondary">
                  <span>Chuyển:</span>
                  <select
                    value={currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="bg-surface-light border border-surface-border text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer min-h-[34px]"
                    title="Chuyển đến trang chỉ định"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        Trang {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </>
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
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-glow-primary"
          >
            Xóa bộ lọc & thử lại
          </button>
        </div>
      )}
    </div>
  );
};
