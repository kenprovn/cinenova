import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-surface-light border border-surface-border flex items-center justify-center mx-auto text-primary shadow-glow-primary">
            <Film className="w-12 h-12" />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-extrabold px-2.5 py-1 rounded-full border border-background">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="heading-font text-3xl sm:text-4xl font-extrabold text-white">
            Trang Không Tồn Tại
          </h1>
          <p className="text-sm text-cinetext-secondary">
            Rất tiếc, đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-primary transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Quay về trang chủ</span>
          </Link>
          <Link
            to="/movies"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface hover:bg-surface-light text-cinetext-primary text-xs font-semibold border border-surface-border transition-colors flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4 text-gold" />
            <span>Xem danh sách phim</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
