import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Shield, User, Menu, X, Ticket } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Phim đang chiếu', path: '/movies' },
    { label: 'Đặt vé', path: '/movies?tab=now' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-surface-border shadow-lg shadow-black/30'
          : 'bg-gradient-to-b from-background/95 via-background/70 to-transparent border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-surface flex items-center justify-center border border-primary/40 shadow-glow-primary/40 group-hover:scale-105 transition-transform duration-200">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="heading-font text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-gold bg-clip-text text-transparent">
                CINENOVA
              </span>
              <span className="text-[9px] uppercase tracking-widest text-gold/80 font-semibold -mt-1">
                Cinema Booking
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(link.path)
                    ? 'text-white bg-surface-light border border-surface-border shadow-sm'
                    : 'text-cinetext-secondary hover:text-white hover:bg-surface/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-surface-border text-cinetext-secondary hover:text-gold hover:border-gold/40 transition-all duration-200"
              title="Khu vực Quản trị rạp (Demo)"
            >
              <Shield className="w-3.5 h-3.5 text-gold" />
              <span>Admin Portal</span>
            </Link>

            <Link
              to="/movies"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary-hover text-white shadow-glow-primary transition-all duration-200 active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              <span>Mua vé</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-cinetext-secondary hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/movies"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white"
            >
              Đặt vé
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-cinetext-secondary hover:text-white hover:bg-surface border border-surface-border transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-surface-border px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-base font-medium',
                  isActive(link.path)
                    ? 'text-white bg-surface-light border border-surface-border'
                    : 'text-cinetext-secondary hover:text-white hover:bg-surface-light/40'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-surface-border space-y-2">
            <Link
              to="/admin"
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gold bg-surface-light border border-gold/30"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Khu vực Quản trị (Admin Demo)</span>
              </span>
              <span className="text-xs bg-gold/20 px-2 py-0.5 rounded text-gold">DEMO</span>
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-cinetext-primary hover:bg-surface-light"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập / Đăng ký</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
