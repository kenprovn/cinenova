import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Film, Star, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { MOCK_MOVIES } from '../../data/mockData';
import { AgeBadge } from '../../components/common/Badge';
import { movieService } from '../../services/movieService';
import { Movie, AgeRating } from '../../types';

export const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for add / edit
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    synopsis: '',
    posterUrl: '',
    bannerUrl: '',
    director: '',
    duration: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    ageRating: 'T16' as AgeRating,
    rating: 8.5,
    isNowShowing: true,
  });

  const loadMovies = () => {
    movieService.getMovies().then((res) => {
      if (res.data.length > 0) {
        setMovies(res.data);
      }
    });
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const triggerNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      originalTitle: '',
      synopsis: '',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      director: '',
      duration: 120,
      releaseDate: new Date().toISOString().split('T')[0],
      ageRating: 'T16',
      rating: 8.5,
      isNowShowing: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      originalTitle: movie.originalTitle,
      synopsis: movie.synopsis,
      posterUrl: movie.posterUrl,
      bannerUrl: movie.bannerUrl,
      director: movie.director,
      duration: movie.duration,
      releaseDate: movie.releaseDate,
      ageRating: movie.ageRating,
      rating: movie.rating,
      isNowShowing: movie.isNowShowing,
    });
    setShowAddModal(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      triggerNotice('Vui lòng nhập tên phim', 'error');
      return;
    }

    setIsSubmitting(true);

    if (editingMovie) {
      // Update
      const res = await movieService.updateMovie(editingMovie.id, {
        title: formData.title,
        originalTitle: formData.originalTitle,
        synopsis: formData.synopsis,
        posterUrl: formData.posterUrl,
        bannerUrl: formData.bannerUrl,
        director: formData.director,
        duration: Number(formData.duration),
        ageRating: formData.ageRating,
        rating: Number(formData.rating),
        isNowShowing: formData.isNowShowing,
      });

      setIsSubmitting(false);
      setShowAddModal(false);

      if (res.error) {
        // Fallback update in local state
        setMovies((prev) =>
          prev.map((m) =>
            m.id === editingMovie.id ? { ...m, ...formData, duration: Number(formData.duration) } : m
          )
        );
        triggerNotice(`Đã cập nhật phim (Bộ nhớ tạm: ${res.error})`, 'success');
      } else {
        triggerNotice('Cập nhật thông tin phim lên Supabase thành công!', 'success');
        loadMovies();
      }
    } else {
      // Create
      const res = await movieService.createMovie({
        title: formData.title,
        originalTitle: formData.originalTitle,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        synopsis: formData.synopsis,
        posterUrl: formData.posterUrl,
        bannerUrl: formData.bannerUrl,
        director: formData.director,
        cast: ['Diễn viên đang cập nhật'],
        genres: ['Hành động', 'Khoa học viễn tưởng'],
        duration: Number(formData.duration),
        releaseDate: formData.releaseDate,
        ageRating: formData.ageRating,
        rating: Number(formData.rating),
        reviewCount: 0,
        isNowShowing: formData.isNowShowing,
        isComingSoon: !formData.isNowShowing,
      });

      setIsSubmitting(false);
      setShowAddModal(false);

      if (res.error) {
        // Add to local state
        const localMovie: Movie = {
          id: `m-local-${Date.now()}`,
          ...formData,
          slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          cast: ['Diễn viên cập nhật'],
          genres: ['Hành động'],
          duration: Number(formData.duration),
          reviewCount: 0,
          isComingSoon: !formData.isNowShowing,
        };
        setMovies((prev) => [localMovie, ...prev]);
        triggerNotice(`Đã thêm phim vào danh sách (Bộ nhớ tạm: ${res.error})`, 'success');
      } else {
        triggerNotice('Thêm phim mới vào Supabase Database thành công!', 'success');
        loadMovies();
      }
    }
  };

  const handleDeleteMovie = async (movie: Movie) => {
    if (!confirm(`Bạn có chắc chắn muốn ẩn phim "${movie.title}" khỏi rạp?`)) return;

    const res = await movieService.deleteMovie(movie.id);
    if (res.error) {
      setMovies((prev) => prev.filter((m) => m.id !== movie.id));
      triggerNotice(`Đã ẩn phim khỏi danh sách hiển thị`, 'success');
    } else {
      triggerNotice('Đã ẩn phim trên cơ sở dữ liệu Supabase!', 'success');
      loadMovies();
    }
  };

  const filtered = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.director.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Danh Mục Phim
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Kết nối trực tiếp bảng PostgreSQL `movies` trên Supabase
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phim mới</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên phim, đạo diễn..."
            className="w-full bg-surface-light border border-surface-border text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-cinetext-muted">
          Tổng cộng: <strong>{filtered.length}</strong> phim
        </span>
      </div>

      {/* Movies Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Phim</th>
                <th className="px-4 py-3">Độ tuổi</th>
                <th className="px-4 py-3">Thời lượng</th>
                <th className="px-4 py-3">Thể loại</th>
                <th className="px-4 py-3">Đánh giá</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {filtered.map((movie) => (
                <tr key={movie.id} className="hover:bg-surface-light/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded border border-surface-border shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{movie.title}</p>
                        <p className="text-[11px] text-cinetext-muted italic">{movie.originalTitle}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">ĐD: {movie.director || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AgeBadge rating={movie.ageRating} />
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{movie.duration} phút</td>
                  <td className="px-4 py-3 text-[11px]">{movie.genres?.join(', ') || 'Điện ảnh'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-bold text-gold">
                      <Star className="w-3 h-3 fill-gold" />
                      {movie.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        movie.isNowShowing
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}
                    >
                      {movie.isNowShowing ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(movie)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-surface border border-surface-border text-cinetext-secondary hover:text-white"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMovie(movie)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-rose-500/20 border border-surface-border text-cinetext-secondary hover:text-rose-400"
                        title="Ẩn phim"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                {editingMovie ? `Chỉnh Sửa: ${editingMovie.title}` : 'Thêm Phim Mới Vào Database'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-cinetext-muted hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Tên phim (Tiếng Việt) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Avatar 3"
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Tựa gốc (English)
                  </label>
                  <input
                    type="text"
                    value={formData.originalTitle}
                    onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })}
                    placeholder="VD: Avatar: Fire and Ash"
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Phân loại độ tuổi
                  </label>
                  <select
                    value={formData.ageRating}
                    onChange={(e) => setFormData({ ...formData, ageRating: e.target.value as AgeRating })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="P">P (Mọi độ tuổi)</option>
                    <option value="K">K (Dưới 13 tuổi có PH)</option>
                    <option value="T13">T13 (13+)</option>
                    <option value="T16">T16 (16+)</option>
                    <option value="T18">T18 (18+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">
                    Điểm đánh giá (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-cinetext-secondary block font-medium mb-1">
                  Đạo diễn
                </label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  placeholder="VD: James Cameron"
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-cinetext-secondary block font-medium mb-1">
                  Đường dẫn ảnh Poster (URL)
                </label>
                <input
                  type="url"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-cinetext-secondary block font-medium mb-1">
                  Mô tả / Tóm tắt nội dung
                </label>
                <textarea
                  rows={3}
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nowShowingCheck"
                  checked={formData.isNowShowing}
                  onChange={(e) => setFormData({ ...formData, isNowShowing: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <label htmlFor="nowShowingCheck" className="text-white font-medium cursor-pointer">
                  Đang chiếu rạp (bỏ chọn nếu là phim sắp khởi chiếu)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-light hover:bg-surface border border-surface-border rounded-lg text-xs text-cinetext-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-glow-primary active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : editingMovie ? 'Cập nhật phim' : 'Lưu vào Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
