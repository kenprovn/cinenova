import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Film, 
  Calendar, 
  Ticket, 
  Home, 
  Clapperboard, 
  Menu, 
  X, 
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'overview' | 'movies' | 'showtimes' | 'bookings';
  setActiveTab: (tab: 'overview' | 'movies' | 'showtimes' | 'bookings') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Tổng quan & Thống kê', icon: LayoutDashboard },
    { id: 'movies', label: 'Quản lý phim', icon: Film },
    { id: 'showtimes', label: 'Quản lý suất chiếu', icon: Calendar },
    { id: 'bookings', label: 'Đơn đặt vé', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-surface border-b border-surface-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-surface-light border border-surface-border text-cinetext-secondary hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="heading-font text-lg font-bold text-white">CINENOVA Admin</span>
        </div>
        <Link
          to="/"
          className="text-xs bg-surface-light hover:bg-surface border border-surface-border text-gold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-surface-border p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-surface flex items-center justify-center border border-primary/40 shadow-glow-primary/40">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="heading-font text-lg font-bold text-white tracking-wide">
                  CINENOVA
                </span>
                <span className="text-[10px] text-gold font-semibold uppercase tracking-wider -mt-1">
                  Admin Portal (Demo)
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-cinetext-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                    isActive
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'text-cinetext-secondary hover:text-white hover:bg-surface-light'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="space-y-3 pt-4 border-t border-surface-border">
          <div className="bg-surface-light/60 p-3 rounded-xl border border-surface-border space-y-1">
            <div className="flex items-center gap-1.5 text-gold text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quản trị Phase 2 (Supabase)</span>
            </div>
            <p className="text-[11px] text-cinetext-muted leading-tight">
              Quản lý danh mục phim, suất chiếu và kiểm soát phân quyền qua PostgreSQL RLS.
            </p>
          </div>

          <Link
            to="/"
            className="w-full py-2.5 px-3 rounded-xl bg-surface-light hover:bg-surface text-cinetext-secondary hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-surface-border transition-colors"
          >
            <Home className="w-4 h-4 text-gold" />
            <span>Quay về trang khách hàng</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
};
