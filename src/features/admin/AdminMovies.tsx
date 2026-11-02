import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Film, Star } from 'lucide-react';
import { MOCK_MOVIES } from '../../data/mockData';
import { AgeBadge } from '../../components/common/Badge';

export const AdminMovies: React.FC = () => {
  const [movies] = useState(MOCK_MOVIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const filtered = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.director.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triggerNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Danh Mục Phim
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Danh sách toàn bộ các tác phẩm điện ảnh đang khai thác tại hệ thống rạp
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phim mới</span>
        </button>
      </div>

      {notification && (
        <div className="bg-gold/15 border border-gold/40 text-gold px-4 py-2.5 rounded-xl text-xs font-semibold">
          {notification}
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
                        <p className="text-[10px] text-zinc-400 mt-0.5">ĐD: {movie.director}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AgeBadge rating={movie.ageRating} />
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{movie.duration} phút</td>
                  <td className="px-4 py-3 text-[11px]">{movie.genres.join(', ')}</td>
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
                        onClick={() => triggerNotice(`Chế độ demo: Chỉnh sửa phim "${movie.title}"`)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-surface border border-surface-border text-cinetext-secondary hover:text-white"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => triggerNotice(`Chế độ demo: Xóa phim "${movie.title}"`)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-rose-500/20 border border-surface-border text-cinetext-secondary hover:text-rose-400"
                        title="Xóa"
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

      {/* Add Movie Modal Demo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              Thêm Phim Mới (Mô Phỏng Demo)
            </h3>
            <p className="text-xs text-cinetext-secondary">
              Tính năng thêm phim với upload poster lên Supabase Storage và lưu vào PostgreSQL sẽ có trong Phase 2.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-cinetext-muted block mb-1">Tên phim</label>
                <input
                  type="text"
                  placeholder="Nhập tên phim tiếng Việt"
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-cinetext-muted block mb-1">Thời lượng (phút)</label>
                <input
                  type="number"
                  placeholder="120"
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-surface-light rounded-lg text-xs text-cinetext-secondary"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  triggerNotice('Đã thêm phim thử nghiệm vào bộ nhớ demo!');
                }}
                className="px-4 py-2 bg-primary rounded-lg text-xs text-white font-bold"
              >
                Lưu mô phỏng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
