import React from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface/80 border-t border-surface-border text-cinetext-secondary text-sm mt-auto">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
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
              Hệ thống rạp chiếu phim với các phòng chiếu tiêu chuẩn, phòng chiếu chuyên biệt IMAX Laser & Dolby Atmos, kết hợp công nghệ đặt vé trực tuyến hiện đại.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Hotline demo: <strong className="text-white">1900 6868</strong> (Số minh họa hệ thống)</span>
              </div>
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Email hỗ trợ: support@cinenova.vn (Dự án demo)</span>
              </div>
              <div className="flex items-center gap-2 text-cinetext-secondary">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Địa chỉ demo: Tòa nhà Landmark 81, 720A Điện Biên Phủ, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Khám phá
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/movies?tab=now" className="hover:text-gold transition-colors">Phim đang chiếu</Link>
              </li>
              <li>
                <Link to="/movies?tab=soon" className="hover:text-gold transition-colors">Phim sắp chiếu</Link>
              </li>
              <li>
                <Link to="/movies?tab=library" className="hover:text-gold transition-colors">Thư viện điện ảnh (500+ phim)</Link>
              </li>
            </ul>
          </div>

          {/* Terms & Policies */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Chính sách
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="hover:text-white cursor-pointer transition-colors">Điều khoản sử dụng</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách thanh toán</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</li>
              <li className="hover:text-white cursor-pointer transition-colors">Quy định đổi trả vé</li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Phương thức hỗ trợ
            </h3>
            <p className="text-xs text-cinetext-muted">
              Hỗ trợ thanh toán mô phỏng (Demo Sandbox):
            </p>
            <div className="flex flex-wrap gap-2 text-xs pt-1">
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">MoMo Demo</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">VNPAY Demo</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">Thẻ Quốc Tế</span>
              <span className="bg-surface-light border border-surface-border px-2.5 py-1 rounded text-zinc-300 font-medium">ZaloPay Demo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Demo Disclaimer */}
      <div className="border-t border-surface-border bg-background/90 py-4 px-4 text-center text-xs text-cinetext-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CINENOVA. Tất cả các quyền được bảo lưu. Dự án xây dựng hệ thống quản lý rạp chiếu & đặt vé trực tuyến.</p>
          <p className="text-[11px] text-zinc-400 bg-surface px-2 py-0.5 rounded border border-surface-border">
            CINENOVA Cinema System – Phiên bản thử nghiệm (Demo Showcase)
          </p>
        </div>
      </div>
    </footer>
  );
};
