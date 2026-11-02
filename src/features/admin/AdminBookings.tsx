import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertOctagon,
  XCircle,
  Eye,
  X,
  Ticket,
  Film,
  MapPin,
  CreditCard,
  User,
  Calendar
} from 'lucide-react';
import { BookingRecord } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { adminService } from '../../services/adminService';

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'expired' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'momo' | 'vnpay'>('all');

  // Selected booking for detailed inspection modal
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    const data = await adminService.getBookings();
    setBookings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // Search term
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        b.bookingCode.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        b.customerPhone.includes(term) ||
        b.customerEmail.toLowerCase().includes(term) ||
        b.movieTitle.toLowerCase().includes(term);

      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'all') {
        matchStatus = b.status === statusFilter;
      }

      // Payment filter
      let matchPayment = true;
      if (paymentFilter !== 'all') {
        matchPayment = b.paymentMethod.toLowerCase().includes(paymentFilter);
      }

      return matchSearch && matchStatus && matchPayment;
    });
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  // Aggregate stats
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const expiredCount = bookings.filter((b) => b.status === 'expired').length;
  const totalConfirmedRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Quản Lý Đơn Đặt Vé
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Tra cứu và kiểm soát toàn bộ vé điện tử và giao dịch thanh toán mô phỏng trong hệ thống
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light border border-surface-border text-cinetext-secondary hover:text-white text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* KPI Stat Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <span className="text-[11px] text-cinetext-muted block">Tổng số đơn</span>
          <p className="text-xl font-bold text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <span className="text-[11px] text-emerald-400 block">Đơn thành công</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <span className="text-[11px] text-gold block">Tổng tiền DEMO</span>
          <p className="text-xl font-bold text-gold mt-1">{formatCurrency(totalConfirmedRevenue)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <span className="text-[11px] text-amber-400 block">Chờ xử lý / Hết hạn</span>
          <p className="text-xl font-bold text-amber-400 mt-1">{pendingCount + expiredCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn, tên khách, số điện thoại, tên phim..."
              className="w-full bg-surface-light border border-surface-border text-white text-base sm:text-xs rounded-lg pl-9 pr-3 py-2.5 min-h-[44px] focus:outline-none focus:border-primary"
            />
          </div>

          {/* Payment Method filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-cinetext-muted whitespace-nowrap">Cổng TT:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full md:w-auto bg-surface-light border border-surface-border text-white text-base sm:text-xs rounded-lg px-2.5 py-2 min-h-[44px] focus:outline-none focus:border-primary"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="momo">MoMo (Demo)</option>
              <option value="vnpay">VNPay (Demo)</option>
            </select>
          </div>
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border/60">
          <span className="text-xs text-cinetext-muted mr-1">Trạng thái:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all touch-manipulation ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-glow-primary'
                : 'bg-surface-light text-cinetext-secondary hover:text-white'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all touch-manipulation ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-500 text-white shadow-glow-emerald'
                : 'bg-surface-light text-cinetext-secondary hover:text-white'
            }`}
          >
            Thành công ({confirmedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all touch-manipulation ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-surface-light text-cinetext-secondary hover:text-white'
            }`}
          >
            Chờ xử lý ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all touch-manipulation ${
              statusFilter === 'expired'
                ? 'bg-rose-500 text-white'
                : 'bg-surface-light text-cinetext-secondary hover:text-white'
            }`}
          >
            Hết hạn ({expiredCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-cinetext-muted">Đang tải danh sách đơn vé từ Supabase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Thời gian đặt</th>
                  <th className="px-4 py-3">Phim & Suất chiếu</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Vị trí ghế</th>
                  <th className="px-4 py-3">Tổng thanh toán (Demo)</th>
                  <th className="px-4 py-3">Cổng TT</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-cinetext-secondary">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-cinetext-muted italic">
                      Không tìm thấy đơn đặt vé nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-surface-light/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-white">{b.bookingCode}</td>
                      <td className="px-4 py-3 text-cinetext-muted whitespace-nowrap">{b.createdAt}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white truncate max-w-[180px]">{b.movieTitle}</p>
                        <p className="text-[11px] text-cinetext-muted">{b.cinemaName} • {b.hallName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{b.customerName}</p>
                        <p className="text-[11px] text-cinetext-muted">{b.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-gold">{b.seats.join(', ')}</td>
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                        {formatCurrency(b.totalPrice)}
                      </td>
                      <td className="px-4 py-3 uppercase text-[11px] text-emerald-400 font-medium">
                        {b.paymentMethod} (Demo)
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : b.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : b.status === 'expired'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {b.status === 'confirmed' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Thành công</span>
                            </>
                          ) : b.status === 'pending' ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Chờ xử lý</span>
                            </>
                          ) : b.status === 'expired' ? (
                            <>
                              <AlertOctagon className="w-3 h-3" />
                              <span>Hết hạn</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Đã hủy</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg bg-surface-light hover:bg-surface border border-surface-border text-cinetext-muted hover:text-white transition-colors"
                          title="Xem chi tiết đơn vé"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-2xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <span className="text-[11px] text-cinetext-muted uppercase tracking-wider font-semibold">
                  Chi tiết đơn đặt vé
                </span>
                <h3 className="text-xl font-bold text-white font-mono mt-0.5">
                  {selectedBooking.bookingCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-lg bg-surface-light text-cinetext-muted hover:text-white transition-colors touch-manipulation"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              {/* Status and Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-light p-3.5 rounded-xl border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="text-cinetext-muted">Trạng thái:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : selectedBooking.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : selectedBooking.status === 'expired'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {selectedBooking.status === 'confirmed'
                      ? 'Thanh toán thành công'
                      : selectedBooking.status === 'pending'
                      ? 'Đang chờ thanh toán'
                      : selectedBooking.status === 'expired'
                      ? 'Đã hết hạn giữ ghế'
                      : 'Đã hủy'}
                  </span>
                </div>
                <span className="text-cinetext-muted">
                  Đặt lúc: <strong className="text-white">{selectedBooking.createdAt}</strong>
                </span>
              </div>

              {/* Movie and Showtime Details */}
              <div className="bg-surface-light p-4 rounded-xl border border-surface-border space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Film className="w-4 h-4 text-gold" />
                  <span>{selectedBooking.movieTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-cinetext-secondary">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{selectedBooking.cinemaName} • {selectedBooking.hallName}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>Ngày {selectedBooking.date} lúc {selectedBooking.time}</span>
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-surface-light p-4 rounded-xl border border-surface-border space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Thông tin khách hàng</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-cinetext-secondary pt-1">
                  <p>
                    <span className="text-cinetext-muted block text-[10px]">Họ và tên:</span>
                    <strong className="text-white">{selectedBooking.customerName}</strong>
                  </p>
                  <p>
                    <span className="text-cinetext-muted block text-[10px]">Số điện thoại:</span>
                    <strong className="text-white">{selectedBooking.customerPhone}</strong>
                  </p>
                  <p>
                    <span className="text-cinetext-muted block text-[10px]">Email:</span>
                    <span className="text-white truncate block">{selectedBooking.customerEmail || 'Chưa cung cấp'}</span>
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-surface-light p-4 rounded-xl border border-surface-border space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chi tiết thanh toán mô phỏng</span>
                </h4>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-cinetext-muted">
                    Phương thức: <strong className="text-white uppercase">{selectedBooking.paymentMethod} (Demo)</strong>
                  </span>
                  <div className="text-right">
                    <span className="text-cinetext-muted text-[10px] block">Tổng thanh toán:</span>
                    <span className="text-lg font-extrabold text-gold">
                      {formatCurrency(selectedBooking.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issued Tickets List */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span>Danh sách vé phát hành ({selectedBooking.tickets?.length || selectedBooking.seats.length} vé)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBooking.tickets && selectedBooking.tickets.length > 0 ? (
                    selectedBooking.tickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-surface-light/70 p-3 rounded-lg border border-surface-border flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-white text-xs">{t.ticketCode}</span>
                          <p className="text-[11px] text-gold font-semibold mt-0.5">Ghế {t.seatNumber}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            t.status === 'used'
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {t.status === 'used' ? 'Đã soát' : 'Hợp lệ'}
                        </span>
                      </div>
                    ))
                  ) : (
                    selectedBooking.seats.map((seatNum) => (
                      <div
                        key={seatNum}
                        className="bg-surface-light/70 p-3 rounded-lg border border-surface-border flex items-center justify-between"
                      >
                        <span className="font-bold text-gold text-xs">Ghế {seatNum}</span>
                        <span className="text-zinc-500 text-[10px]">Chờ phát hành</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-surface-border">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-surface-light hover:bg-surface-light/80 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
