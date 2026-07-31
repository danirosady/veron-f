import React from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const UNIT_POSITIONS = {
  dump_truck: [
    { id: 'FL', label: 'Front Left', x: 10, y: 35, row: 'front' },
    { id: 'FR', label: 'Front Right', x: 90, y: 35, row: 'front' },
    { id: 'RL', label: 'Rear Left', x: 10, y: 75, row: 'rear' },
    { id: 'RR', label: 'Rear Right', x: 90, y: 75, row: 'rear' },
    { id: 'CL', label: 'Center Left', x: 30, y: 75, row: 'rear' },
    { id: 'CR', label: 'Center Right', x: 70, y: 75, row: 'rear' },
  ],
  excavator: [
    { id: 'FL', label: 'Front Left', x: 10, y: 30, row: 'front' },
    { id: 'FR', label: 'Front Right', x: 90, y: 30, row: 'front' },
    { id: 'RL', label: 'Rear Left', x: 10, y: 70, row: 'rear' },
    { id: 'RR', label: 'Rear Right', x: 90, y: 70, row: 'rear' },
  ],
  loader: [
    { id: 'FL', label: 'Front Left', x: 10, y: 40, row: 'front' },
    { id: 'FR', label: 'Front Right', x: 90, y: 40, row: 'front' },
    { id: 'RL', label: 'Rear Left', x: 10, y: 70, row: 'rear' },
    { id: 'RR', label: 'Rear Right', x: 90, y: 70, row: 'rear' },
  ],
  default: [
    { id: 'FL', label: 'Front Left', x: 10, y: 35, row: 'front' },
    { id: 'FR', label: 'Front Right', x: 90, y: 35, row: 'front' },
    { id: 'RL', label: 'Rear Left', x: 10, y: 75, row: 'rear' },
    { id: 'RR', label: 'Rear Right', x: 90, y: 75, row: 'rear' },
  ],
};

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
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-400',
    fill: '#d1d5db',
  },
};

function getTyreColor(rtd) {
  return RTD_COLOR_MAP[getRtdColor(rtd)] || RTD_COLOR_MAP.default;
}

export default function TyrePositionCanvas({
  positions = [],
  unitType = 'default',
  onPositionClick,
  disabled = false,
  className = '',
}) {
  const config = UNIT_POSITIONS[unitType] || UNIT_POSITIONS.default;

  const getPositionData = (posId) => {
    const found = positions.find((p) => p.position === posId);
    return found || null;
  };

  const handleClick = (posConfig, tyreData) => {
    if (!disabled) {
      onPositionClick?.(posConfig.id, tyreData?.tyre || null);
    }
  };

  return (
    <div className={cn('w-full max-w-lg mx-auto', className)}>
      <svg
        viewBox="0 0 100 120"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vehicle body */}
        <rect
          x="15"
          y="25"
          width="70"
          height="70"
          rx="12"
          fill="#f9fafb"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        {/* Cab / front indicator */}
        <rect
          x="30"
          y="25"
          width="40"
          height="12"
          rx="4"
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <text
          x="50"
          y="33.5"
          textAnchor="middle"
          fontSize="5"
          fill="#9ca3af"
          fontWeight="500"
        >
          CAB
        </text>

        {/* Front axle */}
        <line
          x1="20"
          y1="40"
          x2="80"
          y2="40"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />

        {/* Rear axle */}
        <line
          x1="20"
          y1="80"
          x2="80"
          y2="80"
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="3,2"
        />

        {/* Centre line */}
        <line
          x1="50"
          y1="25"
          x2="50"
          y2="95"
          stroke="#e5e7eb"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />

        {/* Row labels */}
        <text x="5" y="42" fontSize="4.5" fill="#9ca3af" fontWeight="500">
          F
        </text>
        <text x="5" y="82" fontSize="4.5" fill="#9ca3af" fontWeight="500">
          R
        </text>

        {/* Tyre position slots */}
        {config.map((pos) => {
          const posData = getPositionData(pos.id);
          const tyre = posData?.tyre;
          const status = posData?.status;
          const rtd = tyre?.rtd ?? tyre?.rtd_avg ?? null;
          const colors = getTyreColor(rtd);
          const isEmpty = !tyre;
          const isScrap = status === 'scrap';
          const isSpare = status === 'spare';
          const serialNumber = tyre?.serial_number || '';

          return (
            <g
              key={pos.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleClick(pos, posData)}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              className={disabled ? '' : 'hover:opacity-80'}
            >
              {/* Tyre circle */}
              {isEmpty ? (
                /* Empty slot — dashed circle with + */
                <g>
                  <circle
                    r="10"
                    fill="#f9fafb"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                    strokeDasharray="3,2"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fill="#d1d5db"
                    fontWeight="400"
                  >
                    +
                  </text>
                </g>
              ) : isScrap ? (
                /* Scrap — X pattern */
                <g>
                  <circle
                    r="10"
                    fill="#f3f4f6"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  />
                  <line x1="-6" y1="-6" x2="6" y2="6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="6" y1="-6" x2="-6" y2="6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              ) : isSpare ? (
                /* Spare — dashed outline */
                <g>
                  <circle
                    r="10"
                    fill="#f9fafb"
                    stroke={colors.fill}
                    strokeWidth="1.5"
                    strokeDasharray="3,2"
                  />
                  {serialNumber && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="3.5"
                      fill={colors.fill}
                      fontWeight="500"
                    >
                      {serialNumber.length > 5 ? serialNumber.slice(0, 5) + '…' : serialNumber}
                    </text>
                  )}
                </g>
              ) : (
                /* Mounted — solid coloured circle */
                <g>
                  <circle
                    r="10"
                    fill={colors.fill}
                    fillOpacity="0.15"
                    stroke={colors.fill}
                    strokeWidth="1.5"
                  />
                  {serialNumber ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="3"
                      fill={colors.fill}
                      fontWeight="600"
                    >
                      {serialNumber.length > 6 ? serialNumber.slice(0, 6) + '…' : serialNumber}
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="3"
                      fill={colors.fill}
                    >
                      –
                    </text>
                  )}
                  {/* RTD indicator dot */}
                  {rtd !== null && (
                    <circle
                      cx="5.5"
                      cy="-5.5"
                      r="2"
                      fill={colors.fill}
                      fillOpacity="0.9"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  )}
                </g>
              )}

              {/* Position label below circle */}
              <text
                y="16"
                textAnchor="middle"
                fontSize="4.5"
                fill="#6b7280"
                fontWeight="500"
              >
                {pos.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-gray-300 border-dashed bg-gray-50 inline-block" />
          <span className="text-xs text-gray-500">Empty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300 inline-block" />
          <span className="text-xs text-gray-500">RTD ≥ 20mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 inline-block" />
          <span className="text-xs text-gray-500">RTD 10–19mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 inline-block" />
          <span className="text-xs text-gray-500">RTD &lt; 10mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 border-dashed inline-block" />
          <span className="text-xs text-gray-500">Spare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 relative inline-block">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="text-[6px] text-gray-400 leading-none font-bold">×</span>
            </span>
          </span>
          <span className="text-xs text-gray-500">Scrap</span>
        </div>
      </div>
    </div>
  );
}
