import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Clapperboard, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const from = (location.state as any)?.from?.pathname || '/';

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setAuthError('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local.');
      return;
    }

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.includes('Invalid login credentials')) {
        setAuthError('Email hoặc mật khẩu không chính xác.');
      } else if (error.includes('Email not confirmed')) {
        setAuthError('Tài khoản chưa được kích hoạt qua email. Vui lòng kiểm tra hộp thư của bạn.');
      } else {
        setAuthError(error);
      }
    } else {
      navigate(from, { replace: true });
    }
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
            Xác thực an toàn qua hệ thống Supabase Auth
          </p>
        </div>

        {authError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

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
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

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
