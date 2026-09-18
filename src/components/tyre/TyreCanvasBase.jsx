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
 * unitType       : string — key into VEHICLE_CHASSIS_IMAGES (e.g. 'ADT_8POS')
 * height         : number — container height in px (default 520)
 * onBoundsChange : (bounds) => void — called with {width, height} when image bounds change
 * showGrid       : bool   — show background grid (default true)
 * showMirror    : bool   — show vertical dashed mirror centre line (default true)
 * className      : string
 * children       : node   — tyre slot components rendered inside overlay
 */
const GRID_SIZE = 40;
const TyreCanvasBase = forwardRef(function TyreCanvasBase({
  children,
  unitType = 'ADT_8POS',
  height = '100%',
  onBoundsChange,
  showGrid = true,
  showMirror = true,
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

  // ── Keep imageBounds in sync with the overlay's ACTUAL rendered size ─────────────────
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const overlayRect = el.getBoundingClientRect();
      onBoundsChange?.({ width: overlayRect.width, height: overlayRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measureBounds = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return;

    // Always center the overlay on the container midpoint.
    // This guarantees x=0.5 maps exactly to the mirror line (SVG x1="50%"),
    // regardless of CSS letterboxing or object-fit rounding.
    const containerCenter = containerRect.width / 2;

    if (hasChassis && imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const overlayLeft = containerCenter - imgRect.width / 2;
      setImageBounds({
        left: overlayLeft,
        top: imgRect.top - containerRect.top,
        width: imgRect.width,
        height: imgRect.height,
      });
      onBoundsChange?.({ width: imgRect.width, height: imgRect.height });
    } else {
      // No chassis image yet (or no chassis at all): use container center as overlay center.
      // Initial state: overlay width=0 → CSS fallback `width: calc(100%-32px)` kicks in.
      // measureBounds runs again once the container has real size, so overlay will be correct.
      const p = 16;
      const overlayWidth = containerRect.width - p * 2;
      const overlayLeft = containerCenter - overlayWidth / 2;
      setImageBounds({
        left: overlayLeft,
        top: p,
        width: overlayWidth,
        height: containerRect.height - p * 2,
      });
      onBoundsChange?.({ width: overlayWidth, height: containerRect.height - p * 2 });
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
      {/* ── Background: full-container gradient + grid ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}
        />
        {showGrid && (
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <pattern
                id="canvas-grid"
                width={GRID_SIZE}
                height={GRID_SIZE}
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2={GRID_SIZE} y2="0" stroke="#94a3b8" strokeWidth="0.5" opacity="0.4" />
                <line x1="0" y1="0" x2="0" y2={GRID_SIZE} stroke="#94a3b8" strokeWidth="0.5" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />
          </svg>
        )}
      </div>

      {/* ── Mirror line: always at container centre ────────────────────────── */}
      {showMirror && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 3 }}
        >
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="8 5"
            opacity="0.7"
          />
        </svg>
      )}

      {/* ── Chassis image: centred in container, above gradient ─────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {hasChassis ? (
          <img
            ref={imageRef}
            src={chassisSrc}
            alt="Vehicle chassis"
            className="max-w-full max-h-full"
            style={{ objectFit: 'contain', opacity: 0.85 }}
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
          zIndex: 2,
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
