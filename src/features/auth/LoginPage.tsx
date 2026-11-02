import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, Lock, Mail, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Email không hợp lệ';
    }
    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      errs.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-6 sm:p-8 rounded-2xl border border-surface-border shadow-2xl space-y-6">
        {/* Logo & Heading */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-surface flex items-center justify-center border border-primary/40 shadow-glow-primary/40">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <span className="heading-font text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-gold bg-clip-text text-transparent">
              CINENOVA
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-cinetext-secondary">
            Đăng nhập để xem lịch sử đặt vé và nhận ưu đãi thành viên
          </p>
        </div>

        {/* Phase 1 Notice */}
        <div className="bg-surface-light border border-surface-border rounded-xl p-3 text-xs text-cinetext-muted flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <p>
            <strong>Phase 1 UI Demo:</strong> Giao diện kiểm tra tương tác form. Tính năng đăng nhập với Supabase Auth sẽ được kết nối ở Phase 2.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-emerald-400">
              Kiểm tra form thành công!
            </p>
            <p className="text-xs text-cinetext-secondary">
              Dữ liệu nhập đã vượt qua validation giao diện. Ở Phase 2, tài khoản sẽ được xác thực với hệ thống cơ sở dữ liệu Supabase Auth.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg"
            >
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.email && (
                <p className="text-rose-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-cinetext-secondary font-medium">
                  Mật khẩu
                </label>
                <span className="text-xs text-gold/80 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cinetext-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all active:scale-95"
            >
              Đăng nhập (Thử nghiệm)
            </button>
          </form>
        )}

        <div className="text-center text-xs text-cinetext-secondary pt-2 border-t border-surface-border">
          <span>Chưa có tài khoản? </span>
          <Link to="/register" className="text-gold font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
