import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { MOCK_SHOWTIMES, MOCK_MOVIES } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';

export const AdminShowtimes: React.FC = () => {
  const [showtimes] = useState(MOCK_SHOWTIMES);
  const [notice, setNotice] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const getMovieTitle = (movieId: string) => {
    return MOCK_MOVIES.find((m) => m.id === movieId)?.title || 'Phim mẫu';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Suất Chiếu
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Điều phối lịch chiếu phim theo cụm rạp, phòng chiếu và khung giờ
          </p>
        </div>

        <button
          onClick={() => triggerNotice('Tính năng xếp lịch chiếu tự động và kiểm tra trùng giờ sẽ triển khai ở Phase 2.')}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo suất chiếu mới</span>
        </button>
      </div>

      {notice && (
        <div className="bg-gold/15 border border-gold/40 text-gold px-4 py-2.5 rounded-xl text-xs font-semibold">
          {notice}
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
                    <span className="text-cinetext-muted text-[11px]"> ~ {st.endTime}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{formatCurrency(st.priceRegular)}</span>
                    <span className="text-cinetext-muted"> / </span>
                    <span className="text-gold font-medium">{formatCurrency(st.priceVip)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => triggerNotice(`Chỉnh sửa suất chiếu ${st.startTime} (${st.hallName})`)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-surface border border-surface-border text-cinetext-secondary hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => triggerNotice(`Xóa suất chiếu ${st.startTime}`)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-rose-500/20 border border-surface-border text-cinetext-secondary hover:text-rose-400"
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
    </div>
  );
};
