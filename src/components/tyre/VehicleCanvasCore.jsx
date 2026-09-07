import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TyreCanvasBase from './TyreCanvasBase';
import TyreSlot from './TyreSlot';
import { getRtdColor } from '@/utils/format';

/**
 * VehicleCanvasCore — view-mode canvas with DnD support.
 *
 * Delegates bounds measurement to TyreCanvasBase (ResizeObserver on the
 * chassis image), computes proportional tyre sizes, then renders TyreSlot
 * children inside the overlay.
 *
 * TyreSlot uses @dnd-kit (useDraggable + useDroppable) for mount/swap flows.
 * All tyre positions use [0,1] percentage coordinates relative to the
 * measured image bounds — the same coordinate always maps to the same
 * pixel regardless of canvas height or chassis image size.
 */
export default function VehicleCanvasCore({
  positions = [],
  unitType = 'ADT_8POS',
  onPositionClick,
  selectedPosition,
  enableSwap = false,
  className = '',
  height = 520,
  isDraggingSpare = false,
  canvasOverlayRef = null,
}) {
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Register the whole canvas overlay as a single droppable target
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  // Sync TyreCanvasBase's forwarded ref (which carries overlayRect + imageBounds) to parent
  useEffect(() => {
    if (canvasOverlayRef) canvasOverlayRef.current = localOverlayRefRef.current;
  });

  // Store the forwarded ref object so useEffect can write to it
  const localOverlayRefRef = useRef(null);
  const localOverlayRef = useCallback((el) => {
    setNodeRef(el);
    localOverlayRefRef.current = el;
  }, [setNodeRef]);

  // Proportional tyre size: 25% of image width, height = 1.15 × width
  // Fallback to fixed minimum so tyres are visible even before ResizeObserver fires
  const tyreWidth = imageBounds.width > 0
    ? Math.max(100, Math.round(imageBounds.width * 0.25))
    : 80;
  const tyreHeight = imageBounds.width > 0
    ? Math.max(120, Math.round(tyreWidth * 1.15))
    : 92;

  const handleBoundsChange = useCallback((bounds) => {
    setImageBounds(bounds);
  }, []);

  // Merge RTD color into each slot for TyreSlot/RtdRing
  // Convert percentage [0,1] positions to pixel offsets from image top-left.
  // Slots use px coords so overlay can be full-width without shifting slot positions.
  const slots = positions
    .slice()
    .sort((a, b) => {
      const ao = (a.axle || '').localeCompare(b.axle || '');
      if (ao !== 0) return ao;
      return (a.x ?? 0) - (b.x ?? 0);
    })
    .map((s) => ({
      ...s,
      rtdColor: s.rtd != null ? getRtdColor(s.rtd) : null,
      // px/py: pixel coords within the full-width overlay.
      // Overlay starts at left=0 (full container width), slots use pixel offsets from there.
      px: imageBounds.width > 0 && s.x != null ? s.x * imageBounds.width : 0,
      py: imageBounds.height > 0 && s.y != null ? s.y * imageBounds.height : 0,
    }));

  return (
    <TyreCanvasBase
      ref={localOverlayRef}
      unitType={unitType}
      height={height}
      onBoundsChange={handleBoundsChange}
      className={className}
    >
      <div className="relative w-full h-full">
        {slots.map((slot) => (
          <TyreSlot
            key={slot.position}
            position={slot.position}
            label={slot.label}
            tyre={slot.tyre}
            rtd={slot.rtd}
            otd={slot.otd}
            status={slot.status}
            isSelected={selectedPosition === slot.position}
            enableSwap={enableSwap}
            tyreWidth={tyreWidth}
            tyreHeight={tyreHeight}
            x={slot.px}
            y={slot.py}
            onClick={onPositionClick}
            isDraggingSpare={isDraggingSpare}
          />
        ))}
      </div>
    </TyreCanvasBase>
  );
}
