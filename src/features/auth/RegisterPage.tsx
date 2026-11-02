import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, Lock, Mail, User, Phone, ShieldAlert } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Email không hợp lệ';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errs.phone = 'Số điện thoại gồm 10-11 chữ số';
    }
    if (!formData.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errs.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-6 sm:p-8 rounded-2xl border border-surface-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-surface flex items-center justify-center border border-primary/40 shadow-glow-primary/40">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <span className="heading-font text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-gold bg-clip-text text-transparent">
              CINENOVA
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Đăng Ký Thành Viên</h1>
          <p className="text-xs text-cinetext-secondary">
            Tận hưởng đặc quyền tích lũy điểm và ưu đãi vé xem phim
          </p>
        </div>

        <div className="bg-surface-light border border-surface-border rounded-xl p-3 text-xs text-cinetext-muted flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <p>
            <strong>Giao diện demo (Phase 1):</strong> Chưa kết nối lưu dữ liệu người dùng thật. Không nhập mật khẩu cá nhân quan trọng của bạn.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-emerald-400">
              Đăng ký thử nghiệm thành công!
            </p>
            <p className="text-xs text-cinetext-secondary">
              Form đã được kiểm tra tính hợp lệ. Tính năng tạo tài khoản chính thức qua Supabase Auth sẽ ra mắt trong Phase 2.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg"
            >
              Chuyển tới đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-cinetext-secondary font-medium mb-1">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinetext-muted" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Xác nhận lại mật khẩu"
                  className="w-full bg-surface-light border border-surface-border text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-cinetext-muted"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-rose-400 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all active:scale-95 mt-2"
            >
              Đăng ký tài khoản (Demo)
            </button>
          </form>
        )}

        <div className="text-center text-xs text-cinetext-secondary pt-2 border-t border-surface-border">
          <span>Đã có tài khoản? </span>
          <Link to="/login" className="text-gold font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
