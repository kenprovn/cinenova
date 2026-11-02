import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Ticket, QrCode, CheckCircle2, AlertTriangle, CreditCard, Wallet, Smartphone, Printer, Home } from 'lucide-react';
import { useBooking } from './BookingContext';
import { formatCurrency } from '../../lib/utils';
import { AgeBadge } from '../../components/common/Badge';

export const CheckoutDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingState, setCustomer, setPaymentMethod, totalAmount, resetBooking } = useBooking();

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    code: string;
    bookingTime: string;
  } | null>(null);

  const { movie, showtime, cinema, selectedSeats, customer, paymentMethod } = bookingState;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate frontend payment processing delay
    setTimeout(() => {
      setIsSubmitting(false);
      const randomCode = 'CN-' + Math.floor(100000 + Math.random() * 900000);
      setConfirmedBooking({
        code: randomCode,
        bookingTime: new Date().toLocaleString('vi-VN'),
      });
    }, 1200);
  };

  const handleFinish = () => {
    resetBooking();
    navigate('/');
  };

  // SUCCESS CONFIRMATION MODAL / SCREEN (DEMO E-TICKET)
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-surface rounded-2xl border border-gold/40 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Demo Ribbon */}
          <div className="absolute top-4 right-4 bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Vé Điện Tử Mô Phỏng Demo
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="heading-font text-2xl font-bold text-white">
              Đặt Vé Thử Nghiệm Thành Công!
            </h1>
            <p className="text-xs text-cinetext-secondary">
              Mã xác nhận giao dịch mô phỏng: <strong className="text-gold font-mono">{confirmedBooking.code}</strong>
            </p>
          </div>

          {/* Ticket Body */}
          <div className="bg-surface-light rounded-xl p-5 border border-surface-border space-y-4">
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

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-cinetext-muted block">Rạp chiếu:</span>
                <span className="text-white font-medium">{cinema?.name}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Thời gian:</span>
                <span className="text-gold font-bold">{showtime.startTime} – Ngày {showtime.date}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Ghế ngồi ({selectedSeats.length} vé):</span>
                <span className="text-white font-bold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Tổng tiền mô phỏng:</span>
                <span className="text-gold font-extrabold">{formatCurrency(totalAmount)}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Khách hàng:</span>
                <span className="text-white font-medium">{customer.fullName} ({customer.phone})</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Cổng thanh toán:</span>
                <span className="text-emerald-400 font-medium uppercase">{paymentMethod} (Demo)</span>
              </div>
            </div>

            {/* Mock QR Code for cinema gate scanning */}
            <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <div className="text-[11px] text-cinetext-secondary">
                  <p className="text-white font-semibold">Mã vé QR Check-in</p>
                  <p className="text-cinetext-muted">Đưa mã này cho nhân viên soát vé tại rạp khi triển khai chính thức.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Quay về trang chủ</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-3 bg-surface-light hover:bg-surface text-cinetext-secondary hover:text-white text-xs font-semibold rounded-xl border border-surface-border transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>In vé mẫu</span>
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

      {/* Demo Warning Alert */}
      <div className="bg-rose-950/40 border border-primary/50 rounded-xl p-4 text-xs text-cinetext-secondary flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-0.5">
            Môi trường thử nghiệm Frontend (Phase 1)
          </strong>
          Giao diện thanh toán dưới đây là mô phỏng trải nghiệm người dùng (UX). Hệ thống KHÔNG thực hiện giao dịch tài chính thật và KHÔNG trừ tiền tài khoản của bạn.
        </div>
      </div>

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
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
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
                    className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
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
                    placeholder="0901234567"
                    className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-4">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3">
              2. Phương Thức Thanh Toán Mô Phỏng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {[
                { id: 'momo', label: 'Ví MoMo (Demo)', desc: 'Thanh toán qua mã QR Ví MoMo', icon: Smartphone },
                { id: 'vnpay', label: 'VNPAY-QR (Demo)', desc: 'Cổng thanh toán ngân hàng VNPAY', icon: Wallet },
                { id: 'card', label: 'Thẻ Quốc Tế (Demo)', desc: 'Visa, MasterCard, JCB', icon: CreditCard },
                { id: 'zalopay', label: 'ZaloPay (Demo)', desc: 'Thanh toán qua ứng dụng ZaloPay', icon: Smartphone },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-surface-light border-primary shadow-glow-primary/20'
                        : 'bg-surface-light/40 border-surface-border hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 text-primary focus:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Icon className="w-4 h-4 text-gold" />
                        <span>{method.label}</span>
                      </div>
                      <p className="text-xs text-cinetext-muted mt-0.5">{method.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Summary & Confirm Button */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-border space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-surface-border pb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              Tóm Tắt Đơn Vé
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-cinetext-muted block">Phim:</span>
                <span className="text-white font-bold text-sm">{movie.title}</span>
              </div>
              <div>
                <span className="text-cinetext-muted block">Rạp:</span>
                <span className="text-white font-medium">{cinema?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Phòng & Định dạng:</span>
                <span className="text-white font-medium">{showtime.hallName} ({showtime.format})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Suất chiếu:</span>
                <span className="text-gold font-bold">{showtime.startTime} • {showtime.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinetext-muted">Ghế ({selectedSeats.length}):</span>
                <span className="text-white font-bold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border space-y-2 text-xs">
              <div className="flex justify-between text-cinetext-secondary">
                <span>Tiền vé ({selectedSeats.length} ghế):</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-cinetext-secondary">
                <span>Phí dịch vụ:</span>
                <span className="text-emerald-400">0 ₫ (Miễn phí)</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gold pt-2 border-t border-surface-border">
                <span>Tổng cộng:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý mô phỏng...</span>
                </span>
              ) : (
                <span>Xác nhận đặt vé (Demo)</span>
              )}
            </button>

            <p className="text-[11px] text-cinetext-muted text-center leading-tight">
              Bằng việc bấm xác nhận, bạn xác nhận trải nghiệm mô phỏng quy trình đặt vé CINENOVA Phase 1.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
