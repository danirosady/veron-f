import React from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const TYRE_IMAGE = '/tyre-pattern.png';

// ─── Tyre Image with RTD Ring ───────────────────────────────────────────────

export default function TyreItem({
  tyre,
  label,
  rtd,
  otd,
  status,
  isSelected,
  isDragging,
  enableSwap,
  onClick,
  size = 48,
}) {
  const isEmpty = status === 'empty' || !tyre;
  const rtdColor = rtd != null ? getRtdColor(rtd) : null;
  const imageOpacity = isEmpty ? 0.2 : 1;
  const imgHeight = size * 1.15;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center transition-all duration-150',
        enableSwap && !isDragging && 'cursor-pointer',
        isDragging && 'opacity-50',
        isSelected && !isDragging && 'scale-105',
      )}
      onClick={onClick}
      title={tyre ? `${label} — ${tyre.serial_number}` : label}
    >
      {/* Tyre image */}
      <div className="relative" style={{ width: size, height: imgHeight }}>
        <img
          src={TYRE_IMAGE}
          alt="Tyre"
          className="object-contain select-none pointer-events-none"
          style={{ width: size, height: imgHeight, opacity: imageOpacity }}
          draggable={false}
        />
        {/* RTD color ring */}
        {!isEmpty && rtdColor && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `3px solid ${rtdColor}`,
              boxShadow: `0 0 8px ${rtdColor}50`,
            }}
          />
        )}
        {/* Selected ring */}
        {isSelected && (
          <div className="absolute -inset-1 rounded-full border-2 border-primary-500 pointer-events-none" />
        )}
      </div>

      {/* Label below */}
      <span className={cn(
        'text-[8px] font-bold mt-0.5 px-1 py-0.5 rounded',
        !isEmpty ? 'text-gray-700' : 'text-gray-400',
      )}>
        {label}
      </span>
    </div>
  );
}
