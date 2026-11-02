import React, { useState } from 'react';
import { Search, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_ADMIN_BOOKINGS } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';

export const AdminBookings: React.FC = () => {
  const [bookings] = useState(MOCK_ADMIN_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = bookings.filter(
    (b) =>
      b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm) ||
      b.movieTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Danh Sách Đơn Đặt Vé
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Tra cứu và kiểm soát toàn bộ vé điện tử đã đặt trong hệ thống rạp
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã vé, tên khách, số điện thoại..."
            className="w-full bg-surface-light border border-surface-border text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-cinetext-muted">
          Tổng cộng: <strong>{filtered.length}</strong> đơn
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Thời gian đặt</th>
                <th className="px-4 py-3">Phim & Suất chiếu</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Vị trí ghế</th>
                <th className="px-4 py-3">Tổng thanh toán</th>
                <th className="px-4 py-3">Cổng TT</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-surface-light/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{b.bookingCode}</td>
                  <td className="px-4 py-3 text-cinetext-muted">{b.createdAt}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{b.movieTitle}</p>
                    <p className="text-[11px] text-cinetext-muted">{b.cinemaName} ({b.hallName})</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{b.customerName}</p>
                    <p className="text-[11px] text-cinetext-muted">{b.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-gold">{b.seats.join(', ')}</td>
                  <td className="px-4 py-3 font-bold text-white">{formatCurrency(b.totalPrice)}</td>
                  <td className="px-4 py-3">{b.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {b.status === 'confirmed' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Thành công</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Chờ duyệt</span>
                        </>
                      )}
                    </span>
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
