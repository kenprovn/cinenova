import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Clapperboard, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-light border border-surface-border flex items-center justify-center animate-pulse">
          <Clapperboard className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-xs text-cinetext-muted font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin access required but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Truy Cập Bị Giới Hạn</h2>
        <p className="text-xs text-cinetext-secondary leading-relaxed">
          Tài khoản của bạn hiện có quyền <strong>Khách hàng</strong>. Để truy cập Khu vực Quản trị CINENOVA, tài khoản cần được cấp quyền <strong>Admin</strong> từ Quản trị viên hệ thống.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-surface-light hover:bg-surface border border-surface-border text-white text-xs font-semibold rounded-xl"
          >
            Quay về Trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
