import React from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, Phone, Mail, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface/80 border-t border-surface-border text-cinetext-secondary text-sm mt-auto">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-surface flex items-center justify-center border border-primary/40 shadow-glow-primary/30">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <span className="heading-font text-xl font-bold tracking-wider text-white">
                CINENOVA
              </span>
            </Link>
            <p className="text-cinetext-secondary text-xs sm:text-sm leading-relaxed max-w-sm">
              Hệ thống rạp chiếu phim chuẩn quốc tế với phòng chiếu IMAX Laser, âm thanh vòm Dolby Atmos và công nghệ đặt vé trực tuyến nhanh chóng, hiện đại.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Hotline: <strong className="text-white">1900 6868</strong> (8:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Hỗ trợ: support@cinenova.vn</span>
              </div>
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Trụ sở: Landmark 81, 720A Điện Biên Phủ, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Khám phá
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/movies" className="hover:text-gold transition-colors">Phim đang chiếu</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-gold transition-colors">Phim sắp chiếu</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-gold transition-colors">Rạp chiếu IMAX</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-gold transition-colors flex items-center gap-1 text-gold/80">
                  <Sparkles className="w-3 h-3" />
                  <span>Trang Admin Demo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Terms & Policies */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Chính sách
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white cursor-pointer transition-colors">Điều khoản sử dụng</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách thanh toán</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</li>
              <li className="hover:text-white cursor-pointer transition-colors">Quy định đổi trả vé</li>
            </ul>
          </div>

          {/* Payment & Certification */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Phương thức hỗ trợ
            </h3>
            <p className="text-xs text-cinetext-muted">
              Mô phỏng hỗ trợ thanh toán qua cổng điện tử trong Phase 2:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">MoMo</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">VNPAY</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">Visa / Master</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">ZaloPay</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Giao dịch bảo mật SSL 256-bit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Demo Disclaimer */}
      <div className="border-t border-surface-border bg-background/90 py-4 px-4 text-center text-xs text-cinetext-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CINENOVA. Tất cả các quyền được bảo lưu. Dự án xây dựng hệ thống quản lý rạp chiếu & đặt vé trực tuyến.</p>
          <p className="text-[11px] text-zinc-400 bg-surface px-2 py-0.5 rounded border border-surface-border">
            Phase 1 Frontend Prototype – Dữ liệu mô phỏng
          </p>
        </div>
      </div>
    </footer>
  );
};
