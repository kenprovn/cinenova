import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Ticket,
  Users,
  Sparkles,
  Database,
  CheckCircle2,
  Clock,
  AlertOctagon,
  XCircle,
  CreditCard,
  Film,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { adminService } from '../../services/adminService';
import { AdminStats } from '../../types';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = () => {
    setIsLoading(true);
    adminService.getDashboardStats().then((res) => {
      setStats(res.stats);
      setIsLiveDb(res.isLiveDb);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="py-24 text-center space-y-3 bg-surface rounded-2xl border border-surface-border">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-cinetext-muted">Đang truy vấn số liệu thống kê từ PostgreSQL...</p>
      </div>
    );
  }

  // Max revenue for bar chart height calculation (avoid division by 0)
  const maxDayRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue), 100000);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Báo Cáo Tổng Quan Rạp Chiếu
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Số liệu thống kê giao dịch thử nghiệm mô phỏng, lưu lượng vé và hiệu suất hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light border border-surface-border text-cinetext-secondary hover:text-white text-xs font-semibold transition-colors"
            title="Làm mới số liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-surface-border text-xs">
            {isLiveDb ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold px-2 py-0.5">
                <Database className="w-3.5 h-3.5" />
                <span>Live Supabase Cloud</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gold font-semibold px-2 py-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chế độ mô phỏng</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>LƯU Ý DỮ LIỆU DEMO:</strong> Tất cả các chỉ số doanh thu dưới đây được tính từ các giao dịch thanh toán mô phỏng (MoMo Demo, VNPay Demo) phục vụ kiểm thử hệ thống CINENOVA, không phải doanh thu ngân hàng thực tế.
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Confirmed Demo Revenue */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Tổng Doanh Thu DEMO</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">
            {formatCurrency(stats.totalDemoRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-cinetext-muted">
            <span>Từ <strong>{stats.totalConfirmedBookings}</strong> đơn thanh toán demo thành công</span>
          </div>
        </div>

        {/* Metric 2: Today Demo Revenue */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Doanh Thu DEMO Hôm Nay</span>
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gold">
            {formatCurrency(stats.todayRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-cinetext-muted">
            <span>{stats.todayTickets} vé xuất trong hôm nay</span>
          </div>
        </div>

        {/* Metric 3: Total Tickets Sold */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Tổng Vé Đã Bán</span>
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalTicketsSold} <span className="text-sm font-normal text-cinetext-muted">vé</span>
          </p>
          <p className="text-[11px] text-cinetext-muted">Tháng này: {formatCurrency(stats.monthlyRevenue)}</p>
        </div>

        {/* Metric 4: Total Bookings */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Tổng Lượt Đặt Vé</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalBookings} <span className="text-sm font-normal text-cinetext-muted">lượt</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.totalConfirmedBookings} đơn hoàn tất ({stats.totalBookings > 0 ? Math.round((stats.totalConfirmedBookings / stats.totalBookings) * 100) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown Chips */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-surface-border space-y-3">
        <h3 className="text-xs font-bold text-cinetext-muted uppercase tracking-wider">
          Phân bố trạng thái đơn đặt vé
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-cinetext-secondary">Thành công</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-400">
              {stats.bookingsByStatus.confirmed}
            </span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-cinetext-secondary">Chờ xử lý</span>
            </div>
            <span className="text-sm font-extrabold text-amber-400">
              {stats.bookingsByStatus.pending}
            </span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-cinetext-secondary">Hết hạn</span>
            </div>
            <span className="text-sm font-extrabold text-rose-400">
              {stats.bookingsByStatus.expired}
            </span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-cinetext-secondary">Đã hủy</span>
            </div>
            <span className="text-sm font-extrabold text-zinc-400">
              {stats.bookingsByStatus.cancelled}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts: 7-Day Revenue & Top Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-surface-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Doanh Thu DEMO 7 Ngày Gần Nhất</h2>
              <p className="text-xs text-cinetext-muted">Biểu đồ giao dịch mô phỏng theo ngày (Giờ Việt Nam)</p>
            </div>
            <span className="text-xs bg-surface-light px-2.5 py-1 rounded-lg text-cinetext-secondary border border-surface-border">
              {stats.revenueByDay[0]?.date.split('-').reverse().join('/')} – {stats.revenueByDay[stats.revenueByDay.length - 1]?.date.split('-').reverse().join('/')}
            </span>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
            {stats.revenueByDay.map((item) => {
              const heightPercent = maxDayRevenue > 0 ? Math.round((item.revenue / maxDayRevenue) * 100) : 0;
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] text-cinetext-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.revenue > 0 ? `${(item.revenue / 1000).toFixed(0)}k` : '0'}
                  </div>
                  <div className="w-full bg-surface-light rounded-t-lg overflow-hidden h-40 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-primary/80 to-primary group-hover:from-gold/80 group-hover:to-gold rounded-t-lg transition-all duration-300 min-h-[4px]"
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-cinetext-secondary group-hover:text-white transition-colors">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Popular Movies Breakdown */}
        <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-gold" />
              <span>Top Phim Bán Chạy</span>
            </h2>
            <p className="text-xs text-cinetext-muted">Tỷ trọng vé đã bán theo phim từ database</p>
          </div>

          <div className="space-y-4">
            {stats.popularMovies.length === 0 ? (
              <p className="text-xs text-cinetext-muted italic py-8 text-center">
                Chưa có đơn vé thành công nào để thống kê phim.
              </p>
            ) : (
              stats.popularMovies.map((m) => (
                <div key={m.title} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-white truncate max-w-[180px]">{m.title}</span>
                    <span className="text-gold font-bold">{m.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gold h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, m.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-cinetext-muted">
                    <span>{m.tickets} vé đã bán</span>
                    <span>{formatCurrency(m.revenue)} (Demo)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <span>Thống Kê Theo Phương Thức Thanh Toán Demo</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.paymentMethodStats.length === 0 ? (
            <p className="text-xs text-cinetext-muted italic col-span-4 py-4 text-center">
              Chưa có giao dịch thanh toán demo nào được ghi nhận.
            </p>
          ) : (
            stats.paymentMethodStats.map((p) => (
              <div key={p.method} className="bg-surface-light p-4 rounded-xl border border-surface-border space-y-1">
                <p className="text-xs font-bold text-white uppercase">{p.label}</p>
                <p className="text-lg font-extrabold text-emerald-400">{formatCurrency(p.amount)}</p>
                <p className="text-[11px] text-cinetext-muted">
                  {p.count} giao dịch ({p.percentage}%)
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Đơn Đặt Vé Mới Nhất</h2>
            <p className="text-xs text-cinetext-muted">Dữ liệu đơn vé thời gian thực ghi nhận từ Supabase</p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
            Live Feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light text-cinetext-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Phim & Suất chiếu</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Ghế</th>
                <th className="px-4 py-3">Tổng tiền (Demo)</th>
                <th className="px-4 py-3">Cổng TT</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {stats.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-cinetext-muted italic">
                    Chưa có đơn đặt vé nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                stats.recentBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-surface-light/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{bk.bookingCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white truncate max-w-[180px]">{bk.movieTitle}</p>
                      <p className="text-[11px] text-cinetext-muted">{bk.hallName} • {bk.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{bk.customerName}</p>
                      <p className="text-[11px] text-cinetext-muted">{bk.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-gold">{bk.seats.join(', ')}</td>
                    <td className="px-4 py-3 font-bold text-white">{formatCurrency(bk.totalPrice)}</td>
                    <td className="px-4 py-3 uppercase text-[11px] text-emerald-400 font-medium">
                      {bk.paymentMethod} (Demo)
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          bk.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : bk.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : bk.status === 'expired'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {bk.status === 'confirmed'
                          ? 'Thành công'
                          : bk.status === 'pending'
                          ? 'Chờ xử lý'
                          : bk.status === 'expired'
                          ? 'Hết hạn'
                          : 'Đã hủy'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
