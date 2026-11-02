import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MOCK_SHOWTIMES, MOCK_MOVIES, MOCK_CINEMAS } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { showtimeService } from '../../services/showtimeService';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import { Showtime, Movie, Cinema } from '../../types';

export const AdminShowtimes: React.FC = () => {
  const [showtimes, setShowtimes] = useState<Showtime[]>(MOCK_SHOWTIMES);
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New showtime form state
  const [formData, setFormData] = useState({
    movieId: MOCK_MOVIES[0]?.id || '',
    cinemaId: MOCK_CINEMAS[0]?.id || '',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:30',
    format: 'IMAX Laser' as '2D Digital' | '3D' | 'IMAX Laser',
    priceRegular: 140000,
    priceVip: 180000,
  });

  const loadData = () => {
    showtimeService.getShowtimes().then((res) => {
      if (res.data.length > 0) setShowtimes(res.data);
    });
    movieService.getMovies().then((res) => {
      if (res.data.length > 0) setMovies(res.data);
    });
    cinemaService.getCinemas().then((res) => {
      if (res.data.length > 0) setCinemas(res.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const getMovieTitle = (movieId: string) => {
    return movies.find((m) => m.id === movieId)?.title || 'Phim đang cập nhật';
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const startsAt = `${formData.date}T${formData.startTime}:00+07:00`;
    const endsAt = `${formData.date}T${formData.endTime}:00+07:00`;

    if (formData.endTime <= formData.startTime) {
      setIsSubmitting(false);
      triggerNotice('Giờ kết thúc phải sau giờ bắt đầu chiếu!', 'error');
      return;
    }

    // Call service with room & times
    const res = await showtimeService.createShowtime({
      movieId: formData.movieId,
      roomId: 'r1000000-0000-0000-0000-000000000001', // Sample Room UUID
      startsAt,
      endsAt,
      format: formData.format,
      priceRegular: Number(formData.priceRegular),
      priceVip: Number(formData.priceVip),
    });

    setIsSubmitting(false);

    if (res.error) {
      if (res.error.includes('trùng')) {
        triggerNotice(res.error, 'error');
        return;
      }
      // If DB error (e.g. offline), add to local state
      const selectedCinema = cinemas.find((c) => c.id === formData.cinemaId);
      const newLocalShowtime: Showtime = {
        id: `st-local-${Date.now()}`,
        movieId: formData.movieId,
        cinemaId: formData.cinemaId,
        cinemaName: selectedCinema?.name || 'CINENOVA Cinema',
        hallId: 'h-1',
        hallName: formData.hallName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        format: formData.format,
        priceRegular: Number(formData.priceRegular),
        priceVip: Number(formData.priceVip),
      };
      setShowtimes((prev) => [newLocalShowtime, ...prev]);
      setShowAddModal(false);
      triggerNotice(`Đã tạo suất chiếu (Bộ nhớ tạm: ${res.error})`, 'success');
    } else {
      setShowAddModal(false);
      triggerNotice('Tạo suất chiếu thành công trên PostgreSQL!', 'success');
      loadData();
    }
  };

  const handleCancelShowtime = async (st: Showtime) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy suất chiếu lúc ${st.startTime} ngày ${st.date}?`)) return;

    const res = await showtimeService.cancelShowtime(st.id);
    if (res.error) {
      setShowtimes((prev) => prev.filter((s) => s.id !== st.id));
      triggerNotice('Đã hủy suất chiếu khỏi danh sách hiển thị', 'success');
    } else {
      triggerNotice('Hủy suất chiếu thành công trên Supabase!', 'success');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Suất Chiếu
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Điều phối lịch chiếu phim có kiểm tra chống trùng lịch tự động (Exclusion Constraint)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo suất chiếu mới</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Showtimes Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Phim</th>
                <th className="px-4 py-3">Cụm rạp</th>
                <th className="px-4 py-3">Phòng chiếu</th>
                <th className="px-4 py-3">Định dạng</th>
                <th className="px-4 py-3">Khung giờ</th>
                <th className="px-4 py-3">Giá vé (Thường / VIP)</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-surface-light/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-white max-w-[200px] truncate">
                    {getMovieTitle(st.movieId)}
                  </td>
                  <td className="px-4 py-3">{st.cinemaName}</td>
                  <td className="px-4 py-3 text-cinetext-primary font-medium">{st.hallName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded text-[10px] font-bold">
                      {st.format}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gold">{st.startTime}</span>
                    <span className="text-cinetext-muted text-[11px]"> ~ {st.endTime} ({st.date})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{formatCurrency(st.priceRegular)}</span>
                    <span className="text-cinetext-muted"> / </span>
                    <span className="text-gold font-medium">{formatCurrency(st.priceVip)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleCancelShowtime(st)}
                      className="p-1.5 rounded-lg bg-surface-light hover:bg-rose-500/20 border border-surface-border text-cinetext-secondary hover:text-rose-400"
                      title="Hủy suất chiếu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Showtime */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Tạo Suất Chiếu Mới
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-cinetext-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="space-y-3.5 text-xs">
              <div>
                <label className="text-cinetext-secondary block font-medium mb-1">Chọn phim chiếu *</label>
                <select
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Cụm rạp *</label>
                  <select
                    value={formData.cinemaId}
                    onChange={(e) => setFormData({ ...formData, cinemaId: e.target.value })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Định dạng chiếu</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="2D Digital">2D Digital</option>
                    <option value="3D">3D</option>
                    <option value="IMAX Laser">IMAX Laser</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Ngày chiếu</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Bắt đầu (Giờ:Phút)</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Kết thúc (Giờ:Phút)</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Giá vé ghế Thường (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.priceRegular}
                    onChange={(e) => setFormData({ ...formData, priceRegular: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-cinetext-secondary block font-medium mb-1">Giá vé ghế VIP (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.priceVip}
                    onChange={(e) => setFormData({ ...formData, priceVip: Number(e.target.value) })}
                    className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
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
                  {isSubmitting ? 'Đang kiểm tra...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
