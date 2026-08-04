import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const TYRE_IMAGE = '/tyre-pattern.png';

// ─── RTD Ring ────────────────────────────────────────────────────────────────

function RtdRing({ rtd }) {
  const color = getRtdColor(rtd);
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{ border: `3px solid ${color}`, boxShadow: `0 0 6px ${color}40` }}
    />
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function TyreTooltip({ tyre, rtd, otd, label }) {
  const color = rtd != null ? getRtdColor(rtd) : '#22c55e';
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-white">{label}</span>
        <span className="text-gray-400">{tyre.serial_number || '—'}</span>
      </div>
      <div className="text-gray-300 mb-1.5">
        {tyre.brand?.name || tyre.brand_name}{tyre.size?.name || tyre.size_name ? ` · ${tyre.size?.name || tyre.size_name}` : ''}
      </div>
      {rtd != null && (
        <div className="mb-1">
          <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
            <span>RTD</span>
            <span className="font-semibold" style={{ color }}>{formatNumber(rtd, 1)}mm</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: otd && otd > 0 ? `${Math.min(100, (rtd / otd) * 100)}%` : `${Math.min(100, (rtd / 30) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-[9px] text-gray-400">
        {tyre.psi && <span>PSI: <span className="text-gray-300 font-medium">{formatNumber(tyre.psi, 0)}</span></span>}
        {tyre.lifetime != null && <span>HM: <span className="text-gray-300 font-medium">{formatNumber(tyre.lifetime, 0)}h</span></span>}
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// ─── Empty Slot ──────────────────────────────────────────────────────────────

function EmptySlot({ id, label, isOver, isDragging }) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'CANVAS_POSITION' } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-150',
        'bg-white/60 backdrop-blur-sm',
        !isDragging && !isOver && 'border-2 border-dashed border-gray-300 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer',
        isDragging && !isOver && 'border-2 border-dashed border-gray-300 bg-white/40 cursor-default',
        isOver && 'border-2 border-primary-500 bg-primary-50 scale-110 shadow-lg shadow-primary-200/50 cursor-grab',
        isDragging && isOver && 'border-2 border-primary-500 bg-primary-50 scale-110 shadow-lg cursor-grabbing',
      )}
      style={{ width: 48, height: 48 }}
    >
      <span className={cn(
        'text-[9px] font-semibold select-none transition-colors',
        isOver ? 'text-primary-600' : 'text-gray-400',
      )}>
        {label}
      </span>
    </div>
  );
}

// ─── Filled Slot ─────────────────────────────────────────────────────────────

function FilledSlot({ id, label, tyre, rtd, otd, status, isSelected, isDragging, enableSwap, isDragOver }) {
  const isEmpty = status === 'empty' || !tyre;
  const imageOpacity = isEmpty ? 0.15 : 1;

  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging: isActiveDrag } = useDraggable({
    id: `mounted-${id}`,
    data: { type: 'MOUNTED_TYRE', position: id, tyre, label },
    disabled: !enableSwap,
  });

  // Combine droppable + draggable refs for filled slots
  const { setNodeRef: dropRef } = useDroppable({
    id: `position-${id}`,
    data: { type: 'CANVAS_POSITION', position: id, tyre, label },
  });

  const setRefs = (el) => {
    dragRef(el);
    dropRef(el);
  };

  const combinedStyle = transform
    ? { width: 56, height: 64, transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : { width: 56, height: 64 };

  return (
    <div
      ref={setRefs}
      style={combinedStyle}
      {...(enableSwap ? { ...attributes, ...listeners } : {})}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-full transition-all duration-150',
        'bg-white shadow-sm',
        enableSwap && !isActiveDrag && 'cursor-grab active:cursor-grabbing select-none',
        !enableSwap && 'cursor-pointer',
        isDragging && 'opacity-60 scale-110',
        isDragOver && 'scale-110 shadow-lg shadow-primary-200/50',
        isSelected && !isDragging && 'ring-2 ring-primary-500 ring-offset-2',
      )}
    >
      {/* Tyre image */}
      <img
        src={TYRE_IMAGE}
        alt="Tyre"
        className="object-contain select-none pointer-events-none"
        style={{ width: 44, height: 50, opacity: imageOpacity }}
        draggable={false}
      />

      {/* RTD ring */}
      {!isEmpty && rtd != null && <RtdRing rtd={rtd} />}

      {/* Label */}
      <div className={cn(
        'absolute bottom-0 text-[8px] font-bold px-1 py-0.5 rounded-b-full w-full text-center',
        !isEmpty ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500',
      )}>
        {label}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── TyreSlot (Main Export) ──────────────────────────────────────────────────

export default function TyreSlot({
  position,
  label,
  tyre,
  rtd,
  otd,
  status,
  isSelected,
  isDragging,
  enableSwap,
  isDragOver,
  onClick,
  droppableId,
}) {
  const isEmpty = status === 'empty' || !tyre;
  const id = droppableId || `position-${position}`;

  if (isEmpty) {
    return (
      <div className="group relative" onClick={() => onClick?.(position, null, 'empty')}>
        <EmptySlot id={id} label={label} isOver={isDragOver} isDragging={isDragging} />
        {isDragOver && (
          <div className="absolute inset-0 rounded-full bg-primary-200/30 animate-pulse pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div
      className="group relative"
      onClick={() => onClick?.(position, tyre, status)}
    >
      <FilledSlot
        id={id}
        label={label}
        tyre={tyre}
        rtd={rtd}
        otd={otd}
        status={status}
        isSelected={isSelected}
        isDragging={isDragging}
        enableSwap={enableSwap}
        isDragOver={isDragOver}
      />
      <TyreTooltip tyre={tyre} rtd={rtd} otd={otd} label={label} />
    </div>
  );
}
