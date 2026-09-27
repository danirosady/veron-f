import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const TYRE_IMAGE = '/tyre-pattern.png';

// ─── Tooltip (Portal-based, escapes all clipping containers) ───────────────────

function TyreTooltip({ tyre, rtd, otd, label, triggerRef, position }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  const color = rtd != null ? getRtdColor(rtd) : '#22c55e';

  // Smart placement: if tyre is in top half of canvas, show tooltip below; else above
  const isTopHalf = (position?.y ?? 0.5) < 0.5;
  const placement = isTopHalf ? 'bottom' : 'top';

  useEffect(() => {
    const el = triggerRef?.current;
    if (!el) return;

    const updatePos = () => {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top + (placement === 'top' ? -8 : rect.height + 8),
        left: rect.left + rect.width / 2,
      });
    };

    updatePos();
    const ro = new ResizeObserver(updatePos);
    ro.observe(el);
    return () => ro.disconnect();
  }, [triggerRef, placement]);

  const tooltip = (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed w-44 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 shadow-xl transition-opacity pointer-events-none z-[9999] whitespace-nowrap',
        visible ? 'opacity-100' : 'opacity-0',
        placement === 'top' ? 'translate-y-full' : '-translate-y-full',
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform: `translateX(-50%) ${placement === 'top' ? 'translateY(-100%)' : 'translateY(0)'}`,
      }}
    >
      {/* Arrow */}
      <div className={cn(
        'absolute left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent',
        placement === 'top' ? '-bottom-1' : '-top-1',
        placement === 'top' ? 'border-t-gray-900' : 'border-b-gray-900',
      )} />

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
    </div>
  );

  return (
    <>
      {/* Invisible hover trigger */}
      <div
        className="absolute inset-0"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      />
      {/* Portal tooltip to body */}
      {typeof document !== 'undefined' && createPortal(tooltip, document.body)}
    </>
  );
}

// ─── Empty Slot ──────────────────────────────────────────────────────────────

function EmptySlot({ id, label, isDragging, isDraggingSpare, tyreWidth, tyreHeight, position }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'CANVAS_POSITION', position, tyre: null, label } });

  const showDragHint = isDraggingSpare && !isOver;
  const showActiveDrop = isOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex items-center justify-center transition-all duration-150',
        !isDragging && !showActiveDrop && 'border border-4 border-dashed border-gray-300/70 hover:border-primary-400 cursor-pointer',
        isDragging && !showActiveDrop && 'border border-4 border-dashed border-gray-300/40 cursor-default',
        showDragHint && 'border border-4 border-dashed border-primary-300 cursor-grab',
        showActiveDrop && 'border border-4 border-primary-500 bg-primary-50/60 cursor-grab scale-105',
      )}
      style={{ width: 60, height: 120, ...(showActiveDrop ? { boxShadow: '0 0 0 3px rgba(59,130,246,0.25)' } : showDragHint ? { boxShadow: '0 0 0 2px rgba(59,130,246,0.15)' } : {}) }}
    >
      <span className={cn(
        'text-[9px] font-semibold select-none transition-colors',
        isOver ? 'text-primary-600' : 'text-gray-400/80',
      )}>
        {label}
      </span>
      {showActiveDrop && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm animate-bounce z-10">
          DROP
        </div>
      )}
    </div>
  );
}

// ─── Filled Slot ─────────────────────────────────────────────────────────────

function FilledSlot({ id, label, tyre, rtd, otd, status, isSelected, isDragging, enableSwap, isDraggingSpare, tyreWidth, tyreHeight }) {
  const isEmpty = status === 'empty' || !tyre;
  const imageOpacity = isEmpty ? 0.15 : 1;

  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging: isActiveDrag } = useDraggable({
    id: `mounted-${id}`,
    data: { type: 'MOUNTED_TYRE', position: id, tyre, label },
    disabled: !enableSwap,
  });

  // Combine droppable + draggable refs for filled slots; use isOver for hover hint
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id,
    data: { type: 'CANVAS_POSITION', position: id, tyre, label },
  });

  const setRefs = (el) => {
    dragRef(el);
    dropRef(el);
  };

  const imgW = Math.round(tyreWidth);
  const imgH = Math.round(tyreHeight);

  const combinedStyle = transform
    ? { width: tyreWidth, height: tyreHeight, transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : { width: tyreWidth, height: tyreHeight };

  const isSwapTarget = isDraggingSpare && isOver;

  return (
    <div
      ref={setRefs}
      {...(enableSwap ? { ...attributes, ...listeners } : {})}
      className={cn(
        'relative flex flex-col items-center justify-center transition-all duration-150',
        enableSwap && !isActiveDrag && 'cursor-grab active:cursor-grabbing select-none',
        !enableSwap && 'cursor-pointer',
        isDragging && 'opacity-60 scale-110',
        isSelected && !isDragging && 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]',
        isSwapTarget && 'scale-105 cursor-grab',
      )}
      style={isSwapTarget ? { ...combinedStyle, boxShadow: '0 0 0 3px rgba(251,146,60,0.35)' } : combinedStyle}
    >
      {/* Tyre image with RTD glow */}
      <img
        src={TYRE_IMAGE}
        alt="Tyre"
        className="object-contain select-none pointer-events-none"
        style={{
          width: imgW-20,
          height: imgH-20,
          opacity: imageOpacity,
          ...(rtd != null ? { filter: `drop-shadow(0 0 5px ${getRtdColor(rtd)})` } : {}),
        }}
        draggable={false}
      />

      {/* Label */}
      <div className={cn(
        'absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap',
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

      {/* Spare-drag swap hint badge */}
      {isSwapTarget && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm animate-bounce z-10">
          SWAP
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
  tyreWidth = 36,
  tyreHeight = 64,
  x,
  y,
  isDraggingSpare = false,
}) {
  const isEmpty = status === 'empty' || !tyre;
  const id = droppableId || `position-${position}`;
  const slotRef = useRef(null);

  const positionStyle = (x != null && y != null) ? {
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
    zIndex: isSelected ? 20 : 1,
  } : { position: 'relative' };

  if (isEmpty) {
    return (
      <div className="group relative" style={positionStyle} onClick={() => onClick?.(position, null, 'empty')}>
        <EmptySlot
          id={id}
          label={label}
          position={position}
          isDragging={isDragging}
          isDraggingSpare={isDraggingSpare}
          tyreWidth={tyreWidth}
          tyreHeight={tyreHeight}
        />
        {isDragOver && (
          <div className="absolute inset-0 rounded-full bg-primary-200/30 animate-pulse pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={slotRef}
      className="group relative"
      style={positionStyle}
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
        isDraggingSpare={isDraggingSpare}
        tyreWidth={tyreWidth}
        tyreHeight={tyreHeight}
      />
      <TyreTooltip
        tyre={tyre}
        rtd={rtd}
        otd={otd}
        label={label}
        triggerRef={slotRef}
        position={{ x, y }}
      />
    </div>
  );
}
