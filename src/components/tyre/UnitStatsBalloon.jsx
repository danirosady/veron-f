import React, { useState } from 'react';
import { Gauge, CircleDotIcon, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, titleCase } from '@/utils/format';
import { TyreIcon } from '@/components/icons';

export default function UnitStatsBalloon({ unit, totalMounted, totalSpare, actionQueueLength, maxPosition }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!unit) return null;

  const effectiveMaxPos = maxPosition ?? unit.max_position;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute left-8 top-8"
      style={{ zIndex: 10 }}
    >
      <div
        className={cn(
          'p-3 flex flex-col overflow-hidden w-50 rounded-xl border border-white/10 shadow-xl text-white transition-all duration-300',
          isHovered
            ? 'bg-black/80 backdrop-blur-0'
            : 'bg-black/70 backdrop-blur-xl'
        )}
      >
        {/* Header */}
        <span className="text-xs font-semibold text-white flex items-center mb-3 gap-1.5">
          <Truck className="w-4 h-4 flex-shrink-0" />
          Unit Status
        </span>

        {/* Stats row */}
        <div className="flex justify-between items-center mb-3">
          <StatPill
            icon={<TyreIcon className="w-10 h-10 text-white/40" />}
            value={totalMounted}
            color="text-green-400"
          />
          <div className="w-px h-8 bg-white/10 flex-shrink-0" />
          <StatPill
            icon={<CircleDotIcon className="w-10 h-10 text-white/40" />}
            value={maxPosition - totalMounted}
            color="text-red-400"
          />
          <div className="w-px h-8 bg-white/10 flex-shrink-0" />
          <StatPill
            icon={<Gauge className="w-10 h-10 text-white/40" />}
            value={formatNumber(unit.current_hm, 0) || '—'}
            color="text-blue-400"
          />
        </div>

        {/* Separator */}
        <div className="border-t border-white/10 mb-3" />

        {/* Unit info */}
        <div className="space-y-1.5">
          <InfoRow label="Unit" value={unit.unit_id || '—'} />
          <InfoRow label="Series" value={unit.unit_model || '—'} />
          <InfoRow label="Plate" value={unit.plate_number || '—'} />
          <InfoRow label="Max Pos" value={effectiveMaxPos ? formatNumber(effectiveMaxPos, 0) : '—'} />
          <InfoRow label="Type" value={unit.unit_type || '—'} />
          {unit.status && (
            <InfoRow label="Status" value={titleCase(unit.status)} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, value, color }) {
  return (
    <div className="text-center items-center flex flex-col px-3">
      <div className="flex items-center">{icon}</div>
      <div className={cn('text-md font-bold leading-none mt-1', color)}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-white/50 flex-shrink-0 w-16">{label}</span>
      <span className="text-xs font-medium text-white truncate">{value}</span>
    </div>
  );
}
