import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { VEHICLE_CHASSIS_IMAGES } from '@/utils/vehicleLayouts';

const TYRE_IMAGE = '/tyre-pattern.png';

/**
 * TyreCanvasBase — shared layout container for all tyre canvas views.
 *
 * Uses ResizeObserver to measure the rendered bounds of the chassis image,
 * then positions the tyre overlay precisely over those bounds (not the container).
 *
 * All tyre positions are [0,1] relative to the image bounds, so the same
 * coordinate always maps to the same pixel regardless of canvas size.
 *
 * Usage:
 * ```jsx
 * <TyreCanvasBase ref={overlayRef} unitType="ADT_8POS" height={520}>
 *   {slots.map(s => <TyreSlot key={s.id} {...s} />)}
 * </TyreCanvasBase>
 * ```
 *
 * Props
 * -----
 * unitType    : string — key into VEHICLE_CHASSIS_IMAGES (e.g. 'ADT_8POS')
 * height      : number — container height in px (default 520)
 * onBoundsChange : (bounds) => void — called with {width, height} when image bounds change
 * className   : string
 * children    : node   — tyre slot components rendered inside overlay
 */
const TyreCanvasBase = forwardRef(function TyreCanvasBase({
  children,
  unitType = 'ADT_8POS',
  height = 520,
  onBoundsChange,
  className = '',
}, ref) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);

  // Expose overlay element + its rendered bounding rect + image bounds via forwardRef
  useEffect(() => {
    if (ref && typeof ref === 'object') {
      ref.getOverlayEl = () => overlayRef.current;
      if (overlayRef.current) {
        const r = overlayRef.current.getBoundingClientRect();
        ref.overlayRect = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
      // Also expose image bounds so parent can normalize pointer coords to image-relative
      ref.imageBounds = imageBounds;
    }
  });

  // Rendered image bounds relative to container top-left (pixels)
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const chassisSrc = VEHICLE_CHASSIS_IMAGES[unitType] || null;
  const hasChassis = Boolean(chassisSrc);

  // ── Measure image bounds ──────────────────────────────────────────────────

  const measureBounds = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    if (hasChassis && imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const bounds = {
        left: imgRect.left - containerRect.left,
        top: imgRect.top - containerRect.top,
        width: imgRect.width,
        height: imgRect.height,
      };
      setImageBounds(bounds);
      onBoundsChange?.(bounds);
    } else {
      // SVG fallback: container rect minus p-4 padding
      const p = 16;
      const bounds = {
        left: p,
        top: p,
        width: containerRect.width - p * 2,
        height: containerRect.height - p * 2,
      };
      setImageBounds(bounds);
      onBoundsChange?.(bounds);
    }
  }, [hasChassis]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    measureBounds();

    const ro = new ResizeObserver(() => measureBounds());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measureBounds]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    measureBounds();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ height }}
    >
      {/* ── Background: chassis image or SVG fallback ─────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}
      >
        {hasChassis ? (
          <img
            ref={imageRef}
            src={chassisSrc}
            alt="Vehicle chassis"
            className="max-w-full max-h-full"
            style={{ objectFit: 'contain', opacity: 0.9 }}
            draggable={false}
            onLoad={handleImageLoad}
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

      {/* ── Tyre overlay: pinned to image bounds ─────────────────────────── */}
      <div
        ref={overlayRef}
        className="absolute"
        style={{
          left: imageBounds.left || 16,
          top: imageBounds.top || 16,
          width: imageBounds.width || 'calc(100% - 32px)',
          height: imageBounds.height || 'calc(100% - 32px)',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default TyreCanvasBase;
export { TYRE_IMAGE };

export function getTyreZIndex(axle = '') {
  if (axle === 'poros_1') return 4;
  if (axle === 'poros_2') return 3;
  return 1;
}
