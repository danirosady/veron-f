import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const RTD_COLOR_MAP = {
  spare: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    fill: '#16a34a',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    fill: '#d97706',
  },
  dismounted: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-600',
    fill: '#dc2626',
  },
  scrap: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-500',
    fill: '#9ca3af',
  },
  mounted: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    fill: '#2563eb',
  },
  empty: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-400',
    fill: '#d1d5db',
  },
};

function getTyreColor(rtd, status) {
  if (status === 'scrap') return RTD_COLOR_MAP.scrap;
  if (status === 'spare') return RTD_COLOR_MAP.spare;
  if (rtd === null || rtd === undefined) return RTD_COLOR_MAP.mounted;
  return RTD_COLOR_MAP[getRtdColor(rtd)] || RTD_COLOR_MAP.mounted;
}

export default function TyrePositionCanvas({
  positions = [],
  unitTypeConfig = null,
  onPositionClick,
  disabled = false,
  className = '',
  height = 400,
}) {
  const [tooltip, setTooltip] = useState(null);

  const canvasWidth = 100;
  const canvasHeight = 100;

  // Use unit type config positions if available, otherwise use the positions array directly
  const layoutPositions = React.useMemo(() => {
    if (unitTypeConfig?.position_config && unitTypeConfig.position_config.length > 0) {
      return unitTypeConfig.position_config.map((pos) => {
        const posData = positions.find((p) => p.position === pos.position);
        return {
          ...pos,
          tyre: posData?.tyre || null,
          rtd: posData?.rtd || posData?.tyre?.rtd || null,
          status: posData?.status || (posData?.tyre ? 'mounted' : 'empty'),
        };
      });
    }
    // Positions from API already have position, label, x, y, tyre, rtd, status
    return positions.map((pos) => ({
      position: pos.position,
      label: pos.label || `Pos ${pos.position}`,
      side: pos.side || '',
      axle: pos.axle || '',
      x: pos.x || 0,
      y: pos.y || 0,
      tyre: pos.tyre || null,
      rtd: pos.rtd || pos.tyre?.rtd || null,
      status: pos.status || (pos.tyre ? 'mounted' : 'empty'),
    }));
  }, [positions, unitTypeConfig]);

  const handleMouseEnter = (pos, event) => {
    if (pos.tyre) {
      setTooltip({ pos, x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className={cn('w-full relative', className)}>
      <svg
        viewBox={`0 0 ${canvasWidth} ${canvasHeight + 15}`}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        style={{ minHeight: height }}
      >
        {/* Vehicle body */}
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          rx="10"
          fill="#f9fafb"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        {/* Cab / front indicator */}
        <rect
          x="30"
          y="15"
          width="40"
          height="10"
          rx="3"
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <text
          x="50"
          y="22.5"
          textAnchor="middle"
          fontSize="4"
          fill="#9ca3af"
          fontWeight="500"
        >
          CAB
        </text>

        {/* Direction arrow */}
        <polygon
          points="50,13 47,17 53,17"
          fill="#9ca3af"
        />
        <text x="50" y="12" textAnchor="middle" fontSize="3.5" fill="#9ca3af" fontWeight="600">
          FRONT
        </text>

        {/* Dynamic axle lines based on layout */}
        {layoutPositions.some((p) => p.axle === 'front') && (
          <>
            <line
              x1="20"
              y1="45"
              x2="80"
              y2="45"
              stroke="#d1d5db"
              strokeWidth="0.8"
              strokeDasharray="2,1.5"
            />
          </>
        )}
        {layoutPositions.some((p) => p.axle !== 'front' && p.axle) && (
          <>
            <line
              x1="20"
              y1="65"
              x2="80"
              y2="65"
              stroke="#d1d5db"
              strokeWidth="0.8"
              strokeDasharray="2,1.5"
            />
          </>
        )}

        {/* Centre line */}
        <line
          x1="50"
          y1="15"
          x2="50"
          y2="85"
          stroke="#e5e7eb"
          strokeWidth="0.5"
          strokeDasharray="1.5,1.5"
        />

        {/* Tyre position slots */}
        {layoutPositions.map((pos) => {
          const colors = getTyreColor(pos.rtd, pos.status);
          const isEmpty = pos.status === 'empty' || !pos.tyre;
          const isScrap = pos.status === 'scrap';
          const serialNumber = pos.tyre?.serial_number || '';
          const label = pos.label || `P${pos.position}`;
          const rtdDisplay = pos.rtd !== null && pos.rtd !== undefined ? pos.rtd : pos.tyre?.rtd;

          return (
            <g
              key={pos.position}
              transform={`translate(${pos.x * 100}, ${pos.y * 100})`}
              onClick={() => !disabled && onPositionClick?.(pos.position, pos.tyre, pos.status)}
              onMouseEnter={(e) => handleMouseEnter(pos, e)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              className={disabled ? '' : 'hover:opacity-80'}
            >
              {isEmpty ? (
                <g>
                  <circle r="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#d1d5db" fontWeight="400">
                    +
                  </text>
                </g>
              ) : isScrap ? (
                <g>
                  <circle r="8" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
                  <line x1="-5" y1="-5" x2="5" y2="5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="5" y1="-5" x2="-5" y2="5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <circle
                    r="8"
                    fill={colors.fill}
                    fillOpacity="0.15"
                    stroke={colors.fill}
                    strokeWidth="1.5"
                  />
                  {serialNumber ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="2.8"
                      fill={colors.fill}
                      fontWeight="600"
                    >
                      {serialNumber.length > 7 ? serialNumber.slice(0, 7) + '…' : serialNumber}
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="2.5"
                      fill={colors.fill}
                    >
                      –
                    </text>
                  )}
                  {rtdDisplay !== null && rtdDisplay !== undefined && (
                    <circle
                      cx="4.5"
                      cy="-4.5"
                      r="1.8"
                      fill={colors.fill}
                      fillOpacity="0.9"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  )}
                </g>
              )}

              {/* Position label */}
              <text
                y="13"
                textAnchor="middle"
                fontSize="3.5"
                fill="#6b7280"
                fontWeight="500"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 border-dashed bg-gray-50 inline-block" />
          <span className="text-[10px] text-gray-500">Empty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-300 inline-block" />
          <span className="text-[10px] text-gray-500">RTD ≥ 20mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-100 border border-yellow-300 inline-block" />
          <span className="text-[10px] text-gray-500">RTD 10–19mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300 inline-block" />
          <span className="text-[10px] text-gray-500">RTD &lt; 10mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-300 border-dashed inline-block" />
          <span className="text-[10px] text-gray-500">Scrap</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            maxWidth: 240,
          }}
        >
          <div className="font-semibold mb-1">{tooltip.pos.tyre?.serial_number || '—'}</div>
          <div className="space-y-0.5 text-gray-300">
            {tooltip.pos.tyre?.brand?.name || tooltip.pos.tyre?.brand_name ? (
              <div>Brand: {tooltip.pos.tyre.brand?.name || tooltip.pos.tyre.brand_name}</div>
            ) : null}
            {tooltip.pos.tyre?.size?.name || tooltip.pos.tyre?.size_name ? (
              <div>Size: {tooltip.pos.tyre.size?.name || tooltip.pos.tyre.size_name}</div>
            ) : null}
            {tooltip.pos.tyre?.pattern?.name || tooltip.pos.tyre?.pattern_name ? (
              <div>Pattern: {tooltip.pos.tyre.pattern?.name || tooltip.pos.tyre.pattern_name}</div>
            ) : null}
            {tooltip.pos.rtd !== null && tooltip.pos.rtd !== undefined && (
              <div>RTD: {formatNumber(tooltip.pos.rtd, 1)}mm</div>
            )}
            {tooltip.pos.tyre?.otd ? (
              <div>OTD: {formatNumber(tooltip.pos.tyre.otd, 1)}mm</div>
            ) : null}
            {tooltip.pos.tyre?.psi ? (
              <div>PSI: {formatNumber(tooltip.pos.tyre.psi, 0)}</div>
            ) : null}
            {tooltip.pos.tyre?.remarks ? (
              <div className="truncate">Note: {tooltip.pos.tyre.remarks}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
