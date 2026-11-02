import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Users, TrendingUp, Sparkles, Database } from 'lucide-react';
import { MOCK_ADMIN_STATS } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { adminService } from '../../services/adminService';
import { AdminStats } from '../../types';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>(MOCK_ADMIN_STATS);
  const [isLiveDb, setIsLiveDb] = useState(false);

  useEffect(() => {
    adminService.getDashboardStats().then((res) => {
      setStats(res.stats);
      setIsLiveDb(res.isLiveDb);
    });
  }, []);

  // Max revenue for CSS bar chart calculation
  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-white">
            Báo Cáo Tổng Quan Rạp Chiếu
          </h1>
          <p className="text-xs sm:text-sm text-cinetext-secondary mt-1">
            Số liệu thống kê doanh thu, lưu lượng vé và hiệu suất phòng chiếu {isLiveDb ? '(Live Supabase)' : '(Dữ liệu minh họa)'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface p-1.5 rounded-xl border border-surface-border text-xs text-cinetext-muted">
          {isLiveDb ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Dữ liệu thực từ Supabase</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gold font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chế độ mô phỏng KPI Phase 1</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Doanh thu hôm nay</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {formatCurrency(stats.todayRevenue)}
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{stats.growthRate}% so với hôm qua</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Doanh thu tháng này</span>
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gold">
            {formatCurrency(stats.monthlyRevenue)}
          </p>
          <p className="text-xs text-cinetext-muted">Mục tiêu quý: 85% hoàn thành</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Vé đã bán hôm nay</span>
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.todayTickets} <span className="text-sm font-normal text-cinetext-muted">vé</span>
          </p>
          <p className="text-xs text-cinetext-muted">Bao gồm 128 vé IMAX Laser</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-cinetext-muted text-xs">
            <span>Tỷ lệ lấp đầy ghế</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.occupancyRate}%
          </p>
          <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Charts Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-surface-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Doanh Thu 7 Ngày Gần Nhất</h2>
              <p className="text-xs text-cinetext-muted">Biểu đồ đối sánh doanh số tuần hiện tại</p>
            </div>
            <span className="text-xs bg-surface-light px-2.5 py-1 rounded-lg text-cinetext-secondary border border-surface-border">
              Tuần 44 / 2026
            </span>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
            {stats.revenueByDay.map((item) => {
              const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] text-cinetext-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {(item.revenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="w-full bg-surface-light rounded-t-lg overflow-hidden h-40 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-primary/80 to-primary group-hover:from-gold/80 group-hover:to-gold rounded-t-lg transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
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
            <h2 className="text-base font-bold text-white">Top Phim Doanh Thu Cao</h2>
            <p className="text-xs text-cinetext-muted">Tỷ trọng vé và doanh thu theo phim</p>
          </div>

          <div className="space-y-4">
            {stats.popularMovies.map((m) => (
              <div key={m.title} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-white truncate max-w-[180px]">{m.title}</span>
                  <span className="text-gold font-bold">{m.percentage}%</span>
                </div>
                <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gold h-full rounded-full"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-cinetext-muted">
                  <span>{m.tickets} vé</span>
                  <span>{formatCurrency(m.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Đơn Đặt Vé Mới Nhất</h2>
            <p className="text-xs text-cinetext-muted">Theo dõi các giao dịch đặt vé trực tuyến vừa phát sinh</p>
          </div>
          <span className="text-xs text-gold bg-gold/10 px-2.5 py-1 rounded border border-gold/30">
            Realtime Demo Feed
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
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-cinetext-secondary">
              {stats.recentBookings.map((bk) => (
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
                  <td className="px-4 py-3">{bk.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        bk.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {bk.status === 'confirmed' ? 'Đã duyệt' : 'Chờ xử lý'}
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
