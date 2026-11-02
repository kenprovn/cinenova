import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  Ticket,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { authService } from '../../services/authService';
import { bookingService, UserBookingHistoryItem } from '../../services/bookingService';
import { formatCurrency } from '../../lib/utils';
import { QRCodeCanvas } from '../../components/common/QRCodeCanvas';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tickets' | 'profile'>('tickets');
  const [fullName, setFullName] = useState(profile?.fullName || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User bookings
  const [bookings, setBookings] = useState<UserBookingHistoryItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected ticket for modal
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<{
    qrToken: string;
    ticketCode: string;
    seatNumber: string;
    movieTitle: string;
    cinemaName: string;
    hallName: string;
    showtimeDate: string;
    showtimeTime: string;
    status: string;
  } | null>(null);

  const loadUserBookings = () => {
    if (!user) return;
    setIsLoadingBookings(true);
    bookingService.getUserBookings().then((res) => {
      setBookings(res);
      setIsLoadingBookings(false);
    });
  };

  useEffect(() => {
    if (user) {
      loadUserBookings();
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    const res = await authService.updateProfile(user.id, { fullName, phone });
    setIsSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      await refreshProfile();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const roleLabel =
    profile?.role === 'admin'
      ? 'Quản Trị Viên (Admin)'
      : profile?.role === 'staff'
      ? 'Nhân Viên (Staff)'
      : 'Thành Viên (Customer)';
  const roleBadgeStyle =
    profile?.role === 'admin'
      ? 'bg-gold/20 text-gold border-gold/40'
      : 'bg-primary/20 text-primary border-primary/40';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-light border border-surface-border flex items-center justify-center text-gold shadow-glow-gold/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="heading-font text-2xl font-extrabold text-white">
              Tài Khoản & Vé Của Tôi
            </h1>
            <p className="text-xs text-cinetext-secondary">
              Xem lại vé điện tử QR đã phát hành và quản lý thông tin thành viên CINENOVA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 text-xs font-bold uppercase transition-colors"
            >
              Vào Admin Portal
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light hover:bg-rose-500/20 text-cinetext-secondary hover:text-rose-400 border border-surface-border text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Tabs & Refresh */}
      <div className="flex items-center justify-between border-b border-surface-border text-xs font-bold">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeTab === 'tickets'
                ? 'border-primary text-white'
                : 'border-transparent text-cinetext-muted hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4 text-primary" />
            <span>Vé & Đơn Đã Đặt ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary text-white'
                : 'border-transparent text-cinetext-muted hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông Tin Cá Nhân</span>
          </button>
        </div>

        {activeTab === 'tickets' && (
          <button
            onClick={loadUserBookings}
            className="flex items-center gap-1 pb-3 text-xs text-cinetext-muted hover:text-white transition-colors"
            title="Tải lại danh sách vé"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: TICKETS & BOOKINGS */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {isLoadingBookings ? (
            <div className="py-20 text-center space-y-3 bg-surface rounded-2xl border border-surface-border">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-cinetext-muted">Đang truy vấn lịch sử đặt vé từ Supabase...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-surface rounded-2xl border border-surface-border p-6">
              <Ticket className="w-12 h-12 text-cinetext-muted mx-auto opacity-50" />
              <h3 className="text-base font-bold text-white">Bạn chưa có đơn đặt vé nào</h3>
              <p className="text-xs text-cinetext-secondary max-w-sm mx-auto">
                Khám phá các bộ phim bom tấn đang chiếu và đặt vé thử nghiệm để nhận vé điện tử QR tại rạp CINENOVA.
              </p>
              <Link
                to="/movies"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary transition-all"
              >
                <span>Khám phá phim ngay</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 space-y-5 shadow-lg overflow-hidden"
                >
                  {/* Booking Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cinetext-muted">Mã đơn:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {booking.bookingCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-cinetext-muted">{booking.createdAt}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : booking.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : booking.status === 'expired'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {booking.status === 'confirmed'
                          ? 'Thanh toán thành công'
                          : booking.status === 'pending'
                          ? 'Chờ thanh toán'
                          : booking.status === 'expired'
                          ? 'Đã hết hạn giữ ghế'
                          : 'Đã hủy'}
                      </span>
                    </div>
                  </div>

                  {/* Movie and Showtime Details */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {booking.moviePoster && (
                      <img
                        src={booking.moviePoster}
                        alt={booking.movieTitle}
                        className="w-20 aspect-[2/3] object-cover rounded-xl border border-surface-border shrink-0"
                      />
                    )}
                    <div className="space-y-2 flex-1 text-xs">
                      <h3 className="text-base font-bold text-white">{booking.movieTitle}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-cinetext-secondary">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{booking.cinemaName} • {booking.hallName}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-gold font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{booking.showtimeStart} ({booking.showtimeFormat}) • {booking.showtimeDate}</span>
                        </p>
                      </div>
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border/50">
                        <div className="flex items-center gap-3">
                          <span className="text-cinetext-muted">
                            Ghế: <strong className="text-white">{booking.seats.join(', ')}</strong>
                          </span>
                          {booking.payment && (
                            <span className="text-[11px] text-emerald-400 uppercase font-medium flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span>{booking.payment.paymentMethod} (Demo)</span>
                            </span>
                          )}
                        </div>
                        <span className="text-gold font-extrabold text-sm">
                          {formatCurrency(booking.totalAmount)} <span className="text-xs font-normal text-cinetext-muted">(Demo)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Tickets Issued (Only if booking has tickets) */}
                  {booking.tickets.length > 0 && (
                    <div className="pt-3 border-t border-surface-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cinetext-muted block">
                          Vé điện tử QR ({booking.tickets.length} vé)
                        </span>
                        <span className="text-[11px] text-cinetext-muted italic">
                          Bấm vào mã QR để phóng to
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {booking.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="bg-surface-light p-3.5 rounded-xl border border-surface-border flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                          >
                            <div className="space-y-1 text-xs flex-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-primary/20 text-white border border-primary/40 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Ghế {t.seatNumber}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    t.status === 'used'
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {t.status === 'used' ? 'Đã soát vé' : 'Hợp lệ'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-mono font-bold text-white text-[11px]">{t.ticketCode}</p>
                                <button
                                  onClick={() => copyToClipboard(t.ticketCode)}
                                  className="text-cinetext-muted hover:text-white p-0.5"
                                  title="Sao chép mã vé"
                                >
                                  {copiedCode === t.ticketCode ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {t.checkedInAt && (
                                <p className="text-[10px] text-zinc-500">
                                  Soát lúc: {new Date(t.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>

                            <div
                              onClick={() =>
                                setSelectedTicketForModal({
                                  qrToken: t.qrToken,
                                  ticketCode: t.ticketCode,
                                  seatNumber: t.seatNumber,
                                  movieTitle: booking.movieTitle,
                                  cinemaName: booking.cinemaName,
                                  hallName: booking.hallName,
                                  showtimeDate: booking.showtimeDate,
                                  showtimeTime: booking.showtimeStart,
                                  status: t.status,
                                })
                              }
                              className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                              title="Bấm để phóng to mã QR"
                            >
                              <QRCodeCanvas value={t.qrToken} size={65} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cinetext-muted">
              Vai trò hệ thống
            </span>
            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${roleBadgeStyle}`}>
              {roleLabel}
            </span>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Email đăng ký
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full bg-surface-light/40 border border-surface-border text-cinetext-muted text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-cinetext-muted mt-1">
                Địa chỉ email không thể thay đổi sau khi đăng ký tài khoản.
              </p>
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-primary transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR ZOOM MODAL */}
      {selectedTicketForModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border max-w-sm w-full p-6 space-y-4 text-center shadow-2xl relative">
            <button
              onClick={() => setSelectedTicketForModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-light text-cinetext-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-gold font-bold uppercase tracking-widest bg-gold/10 px-2.5 py-0.5 rounded border border-gold/30">
                Vé Xem Phim Điện Tử
              </span>
              <h3 className="font-bold text-white text-base mt-2">
                {selectedTicketForModal.movieTitle}
              </h3>
              <p className="text-xs text-cinetext-secondary mt-0.5">
                {selectedTicketForModal.cinemaName} • {selectedTicketForModal.hallName}
              </p>
              <p className="text-xs text-gold font-medium">
                {selectedTicketForModal.showtimeTime} • Ngày {selectedTicketForModal.showtimeDate}
              </p>
            </div>

            <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner mx-auto w-fit">
              <QRCodeCanvas value={selectedTicketForModal.qrToken} size={180} />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-center gap-2">
                <span className="text-cinetext-muted">Mã vé:</span>
                <span className="font-mono font-bold text-white">{selectedTicketForModal.ticketCode}</span>
                <button
                  onClick={() => copyToClipboard(selectedTicketForModal.ticketCode)}
                  className="text-cinetext-muted hover:text-white p-0.5"
                  title="Sao chép mã"
                >
                  {copiedCode === selectedTicketForModal.ticketCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gold font-bold">
                Vị trí ghế: {selectedTicketForModal.seatNumber}
              </p>
              <span
                className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 ${
                  selectedTicketForModal.status === 'used'
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {selectedTicketForModal.status === 'used' ? 'Đã soát vé' : 'Vé hợp lệ'}
              </span>
            </div>

            <p className="text-[11px] text-cinetext-muted">
              Đưa mã QR này trước máy quét tại quầy soát vé để check-in vào phòng chiếu.
            </p>

            <button
              onClick={() => setSelectedTicketForModal(null)}
              className="w-full py-2.5 bg-surface-light hover:bg-surface text-white text-xs font-semibold rounded-xl border border-surface-border transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
