import React from 'react';
import { CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_POSITIONS = ['FL', 'FR', 'RL', 'RR', 'EL', 'ER'];

export default function TyrePositionSelector({
  positions = DEFAULT_POSITIONS,
  selectedPosition,
  onSelect,
  disabled = false,
  className = '',
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {positions.map((pos) => (
        <button
          key={pos}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(pos)}
          className={cn(
            'w-12 h-12 rounded-lg border-2 font-semibold text-sm flex items-center justify-center transition-all duration-200',
            selectedPosition === pos
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <CircleDot className={cn('w-5 h-5', selectedPosition === pos && 'text-primary-600')} />
          <span className="ml-1">{pos}</span>
        </button>
      ))}
    </div>
  );
}
