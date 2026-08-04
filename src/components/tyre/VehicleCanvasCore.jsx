import React, { useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { getRtdColor } from '@/utils/format';
import { VEHICLE_CHASSIS_IMAGES } from '@/utils/vehicleLayouts';

const TYRE_IMAGE = '/tyre-pattern.png';

function getTyreZIndex(slot) {
  const axle = slot.axle || '';
  if (axle.includes('front')) return 4;
  if (axle.includes('bogie')) return 3;
  return 1;
}

function TyrePosition({ slot, isSelected, onClick }) {
  const tyre = slot.tyre;
  const rtd = slot.rtd;
  const isEmpty = !tyre;
  const rtdColor = rtd != null ? getRtdColor(rtd) : null;
  const zIndex = getTyreZIndex(slot);

  const { setNodeRef, isOver } = useDroppable({
    id: `position-${slot.position}`,
    data: { type: 'CANVAS_POSITION', position: slot.position, tyre, label: slot.label },
  });

  return (
    <div
      ref={setNodeRef}
      className="absolute flex flex-col items-center justify-center transition-all duration-150 cursor-pointer"
      style={{
        left: `${(slot.x || 0.5) * 100}%`,
        top: `${(slot.y || 0.5) * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isEmpty ? zIndex - 1 : zIndex,
      }}
      onClick={() => onClick?.(slot.position, tyre, slot.status)}
    >
      <div className="relative" style={{ width: 64, height: 64 }}>
        <img
          src={TYRE_IMAGE}
          alt={slot.label}
          className="object-contain select-none pointer-events-none"
          style={{ width: 64, height: 64, opacity: isEmpty ? 0.15 : 1 }}
          draggable={false}
        />
        {!isEmpty && rtdColor && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `3px solid ${rtdColor}`, boxShadow: `0 0 8px ${rtdColor}50` }}
          />
        )}
        {isSelected && !isOver && (
          <div className="absolute -inset-0.5 rounded-full border-2 border-primary-500 pointer-events-none" />
        )}
        {isOver && (
          <div className="absolute inset-0 rounded-full border-2 border-primary-500 bg-primary-50/40 pointer-events-none animate-pulse" />
        )}
      </div>
      <span
        className={`text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded whitespace-nowrap ${isEmpty ? 'bg-gray-200 text-gray-500' : 'bg-gray-800 text-white'}`}
      >
        {slot.label}
      </span>
    </div>
  );
}

export default function VehicleCanvasCore({
  positions = [],
  unitType = 'ADT_8POS',
  onPositionClick,
  selectedPosition,
  enableSwap = false,
  className = '',
  height = 480,
}) {
  const chassisImage = VEHICLE_CHASSIS_IMAGES[unitType] || null;
  const wrapperRef = useRef(null);
  const [renderedBounds, setRenderedBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      const wrapper = wrapperRef.current;
      const img = wrapper.querySelector('img');
      const svg = wrapper.querySelector('svg');
      const wr = wrapper.getBoundingClientRect();

      if (img && img.complete && img.naturalWidth > 0) {
        const ir = img.getBoundingClientRect();
        setRenderedBounds({
          left: ir.left - wr.left,
          top: ir.top - wr.top,
          width: ir.width,
          height: ir.height,
        });
      } else if (svg) {
        const sr = svg.getBoundingClientRect();
        setRenderedBounds({
          left: sr.left - wr.left,
          top: sr.top - wr.top,
          width: sr.width,
          height: sr.height,
        });
      }
    };

    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    const img = wrapperRef.current?.querySelector('img');
    if (img) img.addEventListener('load', update);
    update();
    return () => {
      ro.disconnect();
      if (img) img.removeEventListener('load', update);
    };
  }, [chassisImage]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div
        ref={wrapperRef}
        className="relative w-full h-full overflow-hidden rounded-xl"
        style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}
      >
        {/* Image: constrained to wrapper with contain, centered */}
        <div className="absolute inset-0 p-4 flex items-center justify-center">
          {chassisImage ? (
            <img
              src={chassisImage}
              alt="Vehicle chassis"
              className="max-w-full max-h-full"
              style={{ objectFit: 'contain', opacity: 0.9 }}
              draggable={false}
            />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="max-w-full max-h-full"
              style={{ opacity: 0.15 }}
            >
              <rect x="10" y="15" width="80" height="62" rx="8" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
              <rect x="30" y="5" width="40" height="13" rx="5" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* Tyre overlay: sized and positioned to match the actual rendered image area */}
        <div
          className="absolute"
          style={{
            left: `${renderedBounds.left + 16}px`,
            top: `${renderedBounds.top + 16}px`,
            width: `${renderedBounds.width}px`,
            height: `${renderedBounds.height}px`,
          }}
        >
          {positions.map((slot) => (
            <TyrePosition
              key={slot.position}
              slot={slot}
              isSelected={selectedPosition === slot.position}
              onClick={onPositionClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
