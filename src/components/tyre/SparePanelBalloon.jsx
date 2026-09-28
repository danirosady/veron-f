import React, { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, getRtdColor } from '@/utils/format';

const TYRE_IMAGE = '/tyre-pattern.png';

export default function SparePanelBalloon({
  tyres = [],
  search = '',
  onSearch,
  onSelect,
  selectedTyreId,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: 'spare-panel',
    data: { type: 'SPARE_PANEL' },
  });

  const filteredTyres = useMemo(() => {
    if (!search?.trim()) return tyres;
    const q = search.toLowerCase();
    return tyres.filter(
      (t) =>
        (t.serial_number || '').toLowerCase().includes(q) ||
        (t.barcode || '').toLowerCase().includes(q) ||
        (t.brand?.name || t.brand_name || '').toLowerCase().includes(q) ||
        (t.size?.name || t.size_name || '').toLowerCase().includes(q)
    );
  }, [tyres, search]);

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute right-8 bottom-8"
      style={{ zIndex: 10 }}
    >
      <div
        className={cn(
          'flex flex-col overflow-hidden max-h-[380px] w-50 rounded-xl border border-white/10 shadow-xl text-white transition-all duration-300',
          isHovered
            ? 'bg-black/80 backdrop-blur-0'
            : 'bg-black/60 backdrop-blur-xl'
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Spare ({tyres.length})
            </span>
            {isOver && (
              <span className="text-[10px] text-primary-300 font-medium animate-pulse">
                Lepas di sini
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Cari barcode, SN, brand..."
              value={search}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-white/20 bg-white/10 text-white rounded-lg placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
        </div>

        {/* Tyre list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
          {filteredTyres.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-6">
              {search ? 'Tidak ada ban yang cocok.' : 'Tidak ada ban spare.'}
            </p>
          ) : (
            filteredTyres.map((tyre) => (
              <SpareTyreCard
                key={tyre.id}
                tyre={tyre}
                onSelect={onSelect}
                isSelected={selectedTyreId === tyre.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SpareTyreCard({ tyre, isSelected, onSelect }) {
  const rtd = tyre.rtd || tyre.rtd_1;
  const rtdColor = getRtdColor(rtd);
  const brand = tyre.brand?.name || tyre.brand_name;
  const size = tyre.size?.name || tyre.size_name;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `spare-${tyre.id}`,
    data: { type: 'SPARE_TYRE', tyre },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 9999 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      className={cn(
        'w-full text-left p-2 rounded-lg border cursor-grab transition-all duration-150',
        isDragging ? 'opacity-30 scale-95' : '',
        isSelected
          ? 'border-primary-400 bg-primary-400/20 ring-1 ring-primary-400'
          : 'border-white/20 bg-white/10 hover:border-primary-400 hover:bg-white/20',
        'active:cursor-grabbing text-white'
      )}
      onClick={() => !isDragging && onSelect?.(tyre)}
    >
      <div className="flex items-center gap-2">
        {/* Tyre image */}
        <img
          src={TYRE_IMAGE}
          alt="Tyre"
          className="object-contain select-none pointer-events-none flex-shrink-0"
          style={{ width: 36, height: 36 * 1.15 }}
          draggable={false}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white text-xs truncate">
              {tyre.serial_number || '—'}
            </span>
            {isSelected && (
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-400 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
          <div className="text-[10px] text-white/60 truncate">{brand} {size}</div>
        </div>
        {rtd != null && (
          <div className="flex-shrink-0 text-right">
            <div className="w-10 h-1.5 bg-white/20 rounded-full overflow-hidden mb-0.5">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (rtd / 30) * 100)}%`, backgroundColor: rtdColor }}
              />
            </div>
            <span className="text-[9px] font-medium" style={{ color: rtdColor }}>
              {formatNumber(rtd, 1)}mm
            </span>
          </div>
        )}
        {/* Drag handle */}
        <svg
          className="w-3.5 h-3.5 text-white/40 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
}
