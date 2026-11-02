import React, { useState } from 'react';
import { X } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Thông báo chế độ demo" className="bg-gradient-to-r from-primary-dark/90 via-surface-light to-primary-dark/90 border-b border-primary/30 text-xs text-cinetext-primary py-1.5 px-4 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 rounded-full bg-gold animate-ping shrink-0" />
          <span className="bg-gold/20 text-gold px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 border border-gold/40">
            Phase 1 Demo
          </span>
          <p className="truncate text-cinetext-secondary">
            Giao diện mô phỏng Frontend CINENOVA. Dữ liệu phim, sơ đồ ghế và thanh toán là mẫu thử nghiệm.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-cinetext-muted hover:text-white transition-colors p-1"
          title="Đóng thông báo"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
