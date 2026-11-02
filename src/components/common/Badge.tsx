import React from 'react';
import { AgeRating } from '../../types';
import { cn } from '../../lib/utils';

interface AgeBadgeProps {
  rating: AgeRating;
  className?: string;
}

export const AgeBadge: React.FC<AgeBadgeProps> = ({ rating, className }) => {
  const getBadgeStyle = (r: AgeRating) => {
    switch (r) {
      case 'P':
        return 'bg-emerald-600/90 text-white border-emerald-500/40';
      case 'K':
        return 'bg-blue-600/90 text-white border-blue-500/40';
      case 'T13':
        return 'bg-amber-600/90 text-white border-amber-500/40';
      case 'T16':
        return 'bg-orange-600/90 text-white border-orange-500/40';
      case 'T18':
        return 'bg-rose-700/90 text-white border-rose-600/40';
      case 'C':
        return 'bg-red-800/90 text-white border-red-700/40';
      default:
        return 'bg-zinc-700 text-zinc-200 border-zinc-600';
    }
  };

  const getLabel = (r: AgeRating) => {
    switch (r) {
      case 'P':
        return 'P - Mọi độ tuổi';
      case 'K':
        return 'K - Dưới 13 tuổi có kèm PH';
      case 'T13':
        return '13+';
      case 'T16':
        return '16+';
      case 'T18':
        return '18+';
      case 'C':
        return 'C - Cấm chiếu';
      default:
        return r;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold text-[11px] px-2 py-0.5 rounded border tracking-wider shadow-sm',
        getBadgeStyle(rating),
        className
      )}
      title={getLabel(rating)}
    >
      {rating}
    </span>
  );
};
