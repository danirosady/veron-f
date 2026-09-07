import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATIC_AXLES = [
  { key: 'poros_1', label: 'Poros 1' },
  { key: 'poros_2', label: 'Poros 2' },
  { key: 'poros_3', label: 'Poros 3' },
  { key: 'poros_4', label: 'Poros 4' },
  { key: 'poros_5', label: 'Poros 5' },
];

const COUNT_MIN = 0;
const COUNT_MAX = 12;

function Stepper({ value, onChange }) {
  return (
    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
      <button
        onClick={() => value > COUNT_MIN && onChange(value - 2)}
        disabled={value <= COUNT_MIN}
        className={cn(
          'w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors',
          value <= COUNT_MIN ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
        )}
      >
        <Minus className="w-3 h-3" />
      </button>
      <div className="w-8 text-center text-xs font-bold border-x border-gray-100 py-1">{value}</div>
      <button
        onClick={() => value < COUNT_MAX && onChange(value + 2)}
        disabled={value >= COUNT_MAX}
        className={cn(
          'w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors',
          value >= COUNT_MAX ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
        )}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DynamicFormationEditor({
  formation = [],
  maxPosition = 10,
  onChange,
  onApply,
}) {
  const activeFormation = STATIC_AXLES.map((def) => {
    const found = formation.find(r => r.axle === def.key);
    return found ? { axle: def.key, count: found.count ?? 0 } : { axle: def.key, count: 0 };
  });

  const total = activeFormation.reduce((s, r) => s + (r.count || 0), 0);
  const isReady = (total === 0 || (total % 2 === 0 && total > 0)) && total <= maxPosition;

  const handleCountChange = (axleKey, newCount) => {
    onChange(activeFormation.map(r =>
      r.axle === axleKey ? { ...r, count: newCount } : r
    ));
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
        <span className="font-semibold text-gray-700">Konfigurasi Formasi</span>
        <span className={cn(
          'text-[10px] font-medium px-1.5 py-0.5 rounded',
          total > maxPosition ? 'bg-red-100 text-red-600' :
          total % 2 !== 0  ? 'bg-amber-100 text-amber-600' :
                              'bg-green-100 text-green-600'
        )}>
          {total}/{maxPosition} ban
        </span>
      </div>

      {/* Table header */}
      <div className="flex items-center px-3 py-1 border-b border-gray-100 text-[10px] text-gray-400 font-medium bg-gray-50/50">
        <div className="flex-1 whitespace-nowrap">Poros</div>
        <div className="w-20 text-center">Jumlah</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {STATIC_AXLES.map((axleDef) => {
          const row = activeFormation.find(r => r.axle === axleDef.key);
          const count = row?.count ?? 0;
          return (
            <div
              key={axleDef.key}
              className="flex items-center px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-gray-700 font-medium whitespace-nowrap">{axleDef.label}</div>
              <div className="w-20 flex justify-center">
                <Stepper
                  value={count}
                  onChange={(v) => handleCountChange(axleDef.key, v)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 mt-auto">
        <button
          onClick={() => onApply?.(activeFormation)}
          disabled={!isReady}
          className={cn(
            'w-full py-1.5 text-xs font-semibold rounded transition-colors',
            isReady
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          Apply Formation
        </button>
      </div>
    </div>
  );
}
