import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Wallet,
  Smartphone,
  Printer,
  Home,
  Clock,
  User
} from 'lucide-react';
import { useBooking } from './BookingContext';
import { formatCurrency } from '../../lib/utils';
import { AgeBadge } from '../../components/common/Badge';
import { useAuth } from '../auth/AuthContext';
import { bookingService, PaymentConfirmationResponse } from '../../services/bookingService';
import { QRCodeCanvas } from '../../components/common/QRCodeCanvas';

export const CheckoutDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingState, setCustomer, setPaymentMethod, totalAmount, resetBooking } = useBooking();
  const { user, profile } = useAuth();

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confirmed payment result from PostgreSQL RPC
  const [confirmedResult, setConfirmedResult] = useState<PaymentConfirmationResponse | null>(null);

  // Remaining hold time
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { movie, showtime, cinema, selectedSeats, customer, paymentMethod, holdExpiresAt } = bookingState;

  // Payload fingerprint strictly ties this checkout token to this exact showtime & seat selection
  const payloadFingerprint = showtime && selectedSeats.length > 0
    ? `${showtime.id}:${[...selectedSeats.map((s) => s.id)].sort().join(',')}`
    : '';

  // Per-checkout attempt token:
  // - Persisted in sessionStorage keyed by payloadFingerprint so that:
  //   * Double-clicks keep the same key.
  //   * Retries keep the same key.
  //   * Network dropouts keep the same key.
  //   * F5 Page Refresh keeps the same key (preventing duplicate pending bookings).
  // - Cleaned up and regenerated when checkout truly ends (payment confirmed) or hold expires/fails.
  const [checkoutSessionToken, setCheckoutSessionToken] = useState(() => {
    if (!payloadFingerprint) {
      return `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    const storageKey = `cinenova_chk_token_${payloadFingerprint}`;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return saved;
      const created = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(storageKey, created);
      return created;
    } catch {
      return `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  });

  // Synchronize token if payloadFingerprint changes
  useEffect(() => {
    if (!payloadFingerprint) return;
    const storageKey = `cinenova_chk_token_${payloadFingerprint}`;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setCheckoutSessionToken(saved);
      } else {
        const created = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(storageKey, created);
        setCheckoutSessionToken(created);
      }
    } catch {
      // ignore
    }
  }, [payloadFingerprint]);

  // Auto-fill logged in user info if available
  useEffect(() => {
    if (user && (!customer.fullName || !customer.email)) {
      setCustomer({
        fullName: customer.fullName || profile?.fullName || user.user_metadata?.full_name || '',
        email: customer.email || user.email || '',
        phone: customer.phone || profile?.phone || user.user_metadata?.phone || '',
      });
    }
  }, [user, profile]);

  // Countdown timer for hold
  useEffect(() => {
    if (!holdExpiresAt) return;

    const targetTime = new Date(holdExpiresAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setSubmitError('Thời gian giữ ghế đã hết hạn! Vui lòng quay lại chọn ghế.');
      }
    };

    updateTimer();
    holdTimerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [holdExpiresAt]);

  // If user enters directly without selecting seats, redirect or show prompt
  if (!movie || !showtime || selectedSeats.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Chưa có thông tin vé cần thanh toán</h2>
        <p className="text-sm text-cinetext-secondary">
          Bạn chưa chọn ghế xem phim. Vui lòng chọn phim và ghế trước khi thực hiện bước này.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          <Ticket className="w-4 h-4" />
          <span>Khám phá danh sách phim</span>
        </Link>
      </div>
    );
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!customer.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }
    if (!customer.email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/\S+@\S+\.\S+/.test(customer.email)) {
      errors.email = 'Địa chỉ email không đúng định dạng';
    }
    if (!customer.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(customer.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    if (!validateForm()) return;

    if (!user) {
      setSubmitError('Vui lòng đăng nhập để hoàn tất thanh toán và nhận vé.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Compute session-based idempotency key for this checkout attempt
    const idempotencyKey = `idem_${user.id}_${checkoutSessionToken}`;

    // 1. Create booking transaction in PostgreSQL with idempotency protection
    const bookingRes = await bookingService.createBooking({
      showtimeId: showtime.id,
      seatIds: selectedSeats.map((s) => s.id),
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      paymentMethod,
      idempotencyKey,
    });

    if (!bookingRes.success || !bookingRes.bookingId) {
      setIsSubmitting(false);
      // If error indicates expired hold or finished session, clean up stored token so subsequent attempt gets fresh token
      if (bookingRes.error?.toLowerCase().includes('hết hạn') || bookingRes.error?.toLowerCase().includes('đã kết thúc')) {
        try {
          sessionStorage.removeItem(`cinenova_chk_token_${payloadFingerprint}`);
        } catch { /* ignore */ }
        setCheckoutSessionToken(`chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      }
      setSubmitError(bookingRes.error || 'Không thể tạo đơn vé. Ghế có thể đã hết hạn giữ.');
      return;
    }

    // 2. Confirm simulated demo payment
    const paymentRes = await bookingService.confirmDemoPayment(
      bookingRes.bookingId,
      paymentMethod
    );

    setIsSubmitting(false);

    if (!paymentRes.success) {
      // If payment failed due to expired hold, clean up stored token
      if (paymentRes.status === 'HOLD_EXPIRED' || paymentRes.error?.toLowerCase().includes('hết hạn')) {
        try {
          sessionStorage.removeItem(`cinenova_chk_token_${payloadFingerprint}`);
        } catch { /* ignore */ }
        setCheckoutSessionToken(`chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      }
      setSubmitError(paymentRes.error || 'Lỗi khi xác nhận thanh toán demo.');
      return;
    }

    // Checkout finished successfully! Clean up token from sessionStorage
    try {
      sessionStorage.removeItem(`cinenova_chk_token_${payloadFingerprint}`);
    } catch { /* ignore */ }

    setConfirmedResult(paymentRes);
  };

  const handleFinish = () => {
    try {
      sessionStorage.removeItem(`cinenova_chk_token_${payloadFingerprint}`);
    } catch { /* ignore */ }
    resetBooking();
    navigate('/');
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SUCCESS CONFIRMATION MODAL / SCREEN (REAL ISSUED QR E-TICKETS)
  if (confirmedResult) {
    const tickets = confirmedResult.tickets || [];

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
        <div className="bg-surface rounded-2xl border border-gold/40 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Demo Ribbon */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <span className="bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              Thanh toán mô phỏng – Không phát sinh giao dịch ngân hàng
            </span>
            <span className="text-xs font-mono text-cinetext-muted">
              Mã GD: {confirmedResult.transactionId || 'DEMO-TXN'}
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-gold/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="heading-font text-2xl font-bold text-white">
              Đặt Vé & Phát Hành Thành Công!
            </h1>
            <p className="text-xs text-cinetext-secondary">
              Mã xác nhận đơn vé: <strong className="text-gold font-mono text-base">{confirmedResult.bookingCode}</strong>
            </p>
          </div>

          {/* Ticket Information Body */}
          <div className="bg-surface-light rounded-xl p-5 border border-surface-border space-y-5">
            <div className="flex gap-4 items-start border-b border-surface-border pb-4">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-20 aspect-[2/3] object-cover rounded-lg border border-surface-border shrink-0"
              />
              <div className="space-y-1 text-xs">
                <AgeBadge rating={movie.ageRating} />
                <h3 className="text-base font-bold text-white mt-1">{movie.title}</h3>
                <p className="text-cinetext-muted italic">{movie.originalTitle}</p>
                <p className="text-gold font-semibold pt-1">{showtime.format} • {showtime.hallName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-cinetext-muted block">Rạp chiếu:</span>
                <span className="text-white font-medium">{cinema?.name}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Thời gian:</span>
                <span className="text-gold font-bold">{showtime.startTime} – {showtime.date}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Vị trí ghế:</span>
                <span className="text-white font-bold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Tổng tiền:</span>
                <span className="text-gold font-extrabold text-sm">
                  {formatCurrency(confirmedResult.totalAmount || totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Khách hàng:</span>
                <span className="text-white font-medium">{customer.fullName}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Cổng TT Demo:</span>
                <span className="text-emerald-400 font-medium uppercase">{confirmedResult.paymentMethod || paymentMethod}</span>
              </div>
            </div>

            {/* Issued QR Tickets List */}
            <div className="pt-4 border-t border-surface-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cinetext-secondary">
                Vé Điện Tử & Mã QR Check-In ({tickets.length > 0 ? tickets.length : selectedSeats.length} vé)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tickets.length > 0 ? (
                  tickets.map((t) => (
                    <div
                      key={t.id || t.ticketCode}
                      className="bg-surface p-4 rounded-xl border border-surface-border flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1 text-xs">
                        <span className="bg-primary/20 text-white border border-primary/40 px-2 py-0.5 rounded text-[11px] font-bold">
                          Ghế {t.seatNumber}
                        </span>
                        <p className="text-white font-mono font-bold text-xs mt-1">{t.ticketCode}</p>
                        <p className="text-[10px] text-cinetext-muted">Mã xác thực cổng</p>
                      </div>
                      <QRCodeCanvas value={t.qrToken} size={90} />
                    </div>
                  ))
                ) : (
                  selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="bg-surface p-4 rounded-xl border border-surface-border flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1 text-xs">
                        <span className="bg-primary/20 text-white border border-primary/40 px-2 py-0.5 rounded text-[11px] font-bold">
                          Ghế {seat.seatNumber}
                        </span>
                        <p className="text-white font-mono font-bold text-xs mt-1">TKT-DEMO-{seat.seatNumber}</p>
                        <p className="text-[10px] text-cinetext-muted">Mã xác thực cổng</p>
                      </div>
                      <QRCodeCanvas value={`CNQR-DEMO-${confirmedResult.bookingCode}-${seat.seatNumber}`} size={90} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleFinish}
              className="w-full sm:flex-1 min-h-[44px] py-3 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-95 shadow-glow-primary"
            >
              <Home className="w-4 h-4" />
              <span>Quay về trang chủ</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-surface-light hover:bg-surface text-gold hover:text-white text-xs font-semibold rounded-xl border border-surface-border transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Lịch sử vé của tôi</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-surface-light hover:bg-surface text-cinetext-secondary hover:text-white text-xs font-semibold rounded-xl border border-surface-border transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In vé</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-cinetext-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại chọn ghế</span>
        </button>
        <span className="text-xs text-cinetext-muted">Bước 3 / 3: Thông Tin & Thanh Toán Demo</span>
      </div>

      {/* Countdown Timer Banner */}
      {remainingSeconds !== null && remainingSeconds > 0 && (
        <div className="bg-gradient-to-r from-primary/20 via-surface to-surface border border-primary/50 rounded-xl p-3 sm:p-4 text-xs flex items-center justify-between gap-4 shadow-lg shadow-primary/10">
          <div className="flex items-center gap-3 text-white">
            <Clock className="w-5 h-5 text-gold animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Thời gian giữ ghế còn lại</p>
              <p className="text-cinetext-muted text-xs">
                Ghế sẽ tự động giải phóng sau khi hết thời gian đếm ngược.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-light border border-surface-border px-3.5 py-1.5 rounded-xl font-mono text-base font-extrabold text-gold shadow-inner shrink-0">
            <span>{formatCountdown(remainingSeconds)}</span>
          </div>
        </div>
      )}

      {/* Demo Warning Alert */}
      <div className="bg-rose-950/40 border border-primary/50 rounded-xl p-4 text-xs text-cinetext-secondary flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-0.5">
            Môi trường thử nghiệm Demo CINENOVA (Phase 3)
          </strong>
          Giao diện thanh toán dưới đây là mô phỏng trải nghiệm người dùng (UX). Hệ thống KHÔNG kết nối tài khoản ngân hàng thật và KHÔNG trừ tiền của bạn. Dữ liệu đơn vé, ghế và mã QR sẽ được ghi nhận vào PostgreSQL.
        </div>
      </div>

      {submitError && (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Grid: Form + Summary */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Customer Info & Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info card */}
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3">
              1. Thông Tin Người Nhận Vé
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-cinetext-secondary font-medium mb-1">
                  Họ và tên <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={customer.fullName}
                  onChange={(e) => setCustomer({ fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-xl px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
                {formErrors.fullName && (
                  <p className="text-rose-400 text-xs mt-1">{formErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-cinetext-secondary font-medium mb-1">
                    Email nhận vé <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ email: e.target.value })}
                    placeholder="tenban@example.com"
                    className="w-full bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-xl px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                  />
                  {formErrors.email && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-cinetext-secondary font-medium mb-1">
                    Số điện thoại <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full bg-surface-light border border-surface-border text-white text-base sm:text-sm rounded-xl px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Card (Demo) */}
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3">
              2. Phương Thức Thanh Toán Demo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'momo', label: 'Ví MoMo (Demo)', icon: Smartphone },
                { id: 'vnpay', label: 'VNPAY QR (Demo)', icon: Wallet },
                { id: 'card', label: 'Thẻ ATM / Visa (Demo)', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 min-h-[72px] touch-manipulation active:scale-[0.98] ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-white shadow-glow-primary/40'
                        : 'bg-surface-light border-surface-border text-cinetext-secondary hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-cinetext-muted'}`} />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Summary & Submit */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              Tóm Tắt Đơn Vé
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Phim:</span>
                <span className="text-white font-bold text-right truncate max-w-[170px]">{movie.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Rạp:</span>
                <span className="text-white font-medium text-right truncate max-w-[170px]">{cinema?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Suất chiếu:</span>
                <span className="text-gold font-bold">{showtime.startTime} – {showtime.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Phòng & Định dạng:</span>
                <span className="text-white">{showtime.hallName} ({showtime.format})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Ghế ngồi ({selectedSeats.length}):</span>
                <span className="text-gold font-bold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cinetext-secondary">Tổng thanh toán:</span>
                <span className="text-2xl font-extrabold text-gold">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || remainingSeconds === 0}
                className={`w-full min-h-[48px] py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-primary transition-all touch-manipulation ${
                  isSubmitting || remainingSeconds === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-primary hover:bg-primary-hover text-white active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang ghi nhận đơn vào PostgreSQL...</span>
                  </>
                ) : (
                  <span>Xác Nhận Thanh Toán DEMO</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
