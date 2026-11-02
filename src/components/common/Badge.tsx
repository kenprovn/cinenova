import React from 'react';
import { AgeRating } from '../../types';
import { cn } from '../../lib/utils';

interface AgeBadgeProps {
  rating?: AgeRating | string | null;
  className?: string;
}

export const AgeBadge: React.FC<AgeBadgeProps> = ({ rating, className }) => {
  const getBadgeStyle = (r?: string | null) => {
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
      case 'UNRATED':
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getLabel = (r?: string | null) => {
    switch (r) {
      case 'P':
        return 'P - Mọi độ tuổi';
      case 'K':
        return 'K - Dưới 13 tuổi có kèm PH';
      case 'T13':
        return '13+ (Khán giả từ đủ 13 tuổi)';
      case 'T16':
        return '16+ (Khán giả từ đủ 16 tuổi)';
      case 'T18':
        return '18+ (Khán giả từ đủ 18 tuổi)';
      case 'C':
        return 'C - Cấm chiếu';
      case 'UNRATED':
      default:
        return 'Chưa phân loại (TBC)';
    }
  };

  const displayText = !rating || rating === 'UNRATED' ? 'TBC' : rating;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold text-[11px] px-2 py-0.5 rounded border tracking-wider shadow-sm',
        getBadgeStyle(rating),
        className
      )}
      title={getLabel(rating)}
    >
      {displayText}
    </span>
  );
};
