import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Shield, LogOut, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from './AuthContext';
import { authService } from '../../services/authService';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.fullName || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  if (!user) {
    navigate('/login');
    return null;
  }

  const roleLabel = profile?.role === 'admin' ? 'Quản Trị Viên (Admin)' : profile?.role === 'staff' ? 'Nhân Viên (Staff)' : 'Thành Viên (Customer)';
  const roleBadgeStyle = profile?.role === 'admin' ? 'bg-gold/20 text-gold border-gold/40' : 'bg-primary/20 text-primary border-primary/40';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-light border border-surface-border flex items-center justify-center text-gold shadow-glow-gold/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="heading-font text-2xl font-extrabold text-white">
              Tài Khoản Của Tôi
            </h1>
            <p className="text-xs text-cinetext-secondary">
              Quản lý thông tin cá nhân và quyền truy cập CINENOVA
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light hover:bg-rose-500/20 text-cinetext-secondary hover:text-rose-400 border border-surface-border text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
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

      {/* Profile Form */}
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
              Địa chỉ email không thể thay đổi sau khi đăng ký.
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

      {profile?.role === 'admin' && (
        <div className="bg-gradient-to-r from-gold/10 via-surface to-surface p-5 rounded-2xl border border-gold/30 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-gold" />
              Quyền Quản Trị Hệ Thống
            </h3>
            <p className="text-xs text-cinetext-secondary mt-0.5">
              Bạn có quyền truy cập vào bảng điều khiển quản trị, quản lý phim và suất chiếu.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gold hover:bg-gold-hover text-slate-950 font-bold text-xs uppercase rounded-xl tracking-wider shrink-0 transition-colors"
          >
            Vào Admin
          </button>
        </div>
      )}
    </div>
  );
};
