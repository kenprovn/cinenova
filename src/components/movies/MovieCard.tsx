import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Ticket, Info } from 'lucide-react';
import { Movie } from '../../types';
import { AgeBadge } from '../common/Badge';

interface MovieCardProps {
  movie: Movie;
}

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(movie.posterUrl);
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(FALLBACK_POSTER);
    }
  };

  return (
    <div className="group relative bg-surface rounded-xl overflow-hidden border border-surface-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 flex flex-col h-full">
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-light">
        <img
          src={imgSrc}
          alt={movie.title}
          onError={handleImageError}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <AgeBadge rating={movie.ageRating} />
          {movie.isFeatured && (
            <span className="bg-gold text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded shadow tracking-wide">
              HOT
            </span>
          )}
        </div>

        {/* Rating badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 z-10 text-xs font-semibold text-gold">
          <Star className="w-3 h-3 fill-gold text-gold" />
          <span>{movie.rating}</span>
        </div>

        {/* Duration badge at bottom poster */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] text-zinc-300 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-gold" />
          <span>{movie.duration} phút</span>
        </div>

        {/* Quick action overlay on desktop hover */}
        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5 p-4 z-20">
          <button
            onClick={() => navigate(`/booking/${movie.id}`)}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all active:scale-95"
          >
            <Ticket className="w-4 h-4" />
            <span>Đặt vé ngay</span>
          </button>
          <Link
            to={`/movies/${movie.id}`}
            className="w-full py-2 px-4 rounded-lg bg-surface-light/90 hover:bg-white hover:text-slate-900 text-cinetext-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10 transition-all text-center"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Xem chi tiết</span>
          </Link>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-gold/90 truncate uppercase tracking-wider">
            {movie.genres.slice(0, 2).join(' • ')}
          </p>
          <Link to={`/movies/${movie.id}`}>
            <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 hover:text-gold transition-colors mt-0.5" title={movie.title}>
              {movie.title}
            </h3>
          </Link>
          <p className="text-xs text-cinetext-muted line-clamp-1 italic">
            {movie.originalTitle}
          </p>
        </div>

        {/* Mobile action button (always visible on touch screens) */}
        <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between sm:hidden">
          <Link
            to={`/booking/${movie.id}`}
            className="flex-1 py-1.5 text-center bg-primary text-white rounded text-xs font-bold flex items-center justify-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Đặt vé</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
