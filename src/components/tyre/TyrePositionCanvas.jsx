import React, { useState, useMemo, useCallback } from 'react';
import VehicleCanvasCore from './VehicleCanvasCore';

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TyrePositionCanvas({
  positions = [],
  unitTypeConfig = null,
  tyresData = null,
  onPositionClick,
  mode = 'view',
  height = 480,
  className = '',
}) {
  const [selectedPosition, setSelectedPosition] = useState(null);

  const unitType = unitTypeConfig?.unit_type || 'ADT_8POS';

  // Merge positions with tyre data
  const mergedPositions = useMemo(() => {
    return positions.map((pos) => ({
      ...pos,
      tyre: tyresData?.find(t => t.position === pos.position)?.tyre || pos.tyre || null,
      rtd: tyresData?.find(t => t.position === pos.position)?.rtd || pos.rtd || pos.tyre?.rtd || pos.tyre?.rtd_1 || null,
      status: tyresData?.find(t => t.position === pos.position)?.status || pos.status || (pos.tyre ? 'mounted' : 'empty'),
      otd: pos.tyre?.otd || tyresData?.find(t => t.position === pos.position)?.tyre?.otd,
      lifetime: pos.tyre?.lifetime || tyresData?.find(t => t.position === pos.position)?.tyre?.lifetime,
      psi: pos.tyre?.psi || tyresData?.find(t => t.position === pos.position)?.tyre?.psi,
    }));
  }, [positions, tyresData]);

  const handlePositionClick = useCallback((position, tyre, status) => {
    if (mode === 'edit') return;
    setSelectedPosition(position);
    onPositionClick?.(position, tyre, status);
  }, [mode, onPositionClick]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div
        className="relative rounded-xl border border-gray-200 overflow-hidden"
        style={{ minHeight: height }}
      >
        <VehicleCanvasCore
          positions={mergedPositions}
          unitType={unitType}
          layoutMode="view"
          onPositionClick={handlePositionClick}
          selectedPosition={selectedPosition}
          enableSwap={mode === 'view'}
          height={height}
        />

        {/* Edit mode indicator */}
        {mode === 'edit' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-amber-300 shadow-sm z-10">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            EDIT MODE
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
        <LegendItem color="#d1d5db" label="Empty" dashed />
        <LegendItem color="#22c55e" label="RTD ≥ 20mm" />
        <LegendItem color="#eab308" label="RTD 10–19mm" />
        <LegendItem color="#f97316" label="RTD 5–9mm" />
        <LegendItem color="#ef4444" label="RTD < 5mm" />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{
        backgroundColor: color,
        border: dashed ? `2px dashed ${color}` : 'none',
        opacity: dashed ? 0.5 : 1,
      }} />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
