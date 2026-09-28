import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, titleCase } from '@/utils/format';

function ActionBadge({ action }) {
  const variants = {
    mount: 'bg-green-500/20 text-green-300 border border-green-500/40',
    dismount: 'bg-red-500/20 text-red-300 border border-red-500/40',
    swap: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold', variants[action] || variants.swap)}>
      {titleCase(action)}
    </span>
  );
}

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return <span className="text-white/40 text-[10px]">—</span>;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/80">
      {formatNumber(rtd, 1)}mm
    </span>
  );
}

export default function ActionQueueBalloon({
  queue = [],
  onRemove,
  onClearAll,
  onSubmitAll,
  isSubmitting = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // if (queue.length === 0) return setIsEmpty(true);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('absolute right-8 top-8', queue.length === 0 ? 'opacity-50' : 'opacity-100')}
      style={{ zIndex: 10 }}
    >
      <div
        className={cn(
          'w-[400px] h-[250px] flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-xl text-white transition-all duration-300',
          isHovered
            ? 'bg-black/80 backdrop-blur-md'
            : 'bg-black/60 backdrop-blur-md'
            
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Queue ({queue.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onClearAll}
              className="px-2 py-1 text-[10px] rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onSubmitAll}
              disabled={isSubmitting}
              className="px-2 py-1 text-[10px] rounded bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {isSubmitting ? '...' : `Submit (${queue.length})`}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-black/60 backdrop-blur-sm">
              <tr className="text-white/40 border-b border-white/5">
                <th className="text-left px-2 py-1.5 font-medium w-5">#</th>
                <th className="text-left px-1 py-1.5 font-medium w-8">Pos</th>
                <th className="text-left px-1 py-1.5 font-medium">Action</th>
                <th className="text-left px-1 py-1.5 font-medium">Old</th>
                <th className="text-left px-1 py-1.5 font-medium">New</th>
                <th className="text-left px-1 py-1.5 font-medium">RTD</th>
                <th className="text-right px-1 py-1.5 font-medium w-5"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-2 py-1.5 text-white/40">{idx + 1}</td>
                  <td className="px-1 py-1.5">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[9px] font-semibold min-w-[20px]">
                      {item.position}
                    </span>
                  </td>
                  <td className="px-1 py-1.5">
                    <ActionBadge action={item.action} />
                  </td>
                  <td className="px-1 py-1.5 text-white/70 truncate max-w-[50px]" title={item.tyre?.serial_number}>
                    {item.tyre?.serial_number || '—'}
                  </td>
                  <td className="px-1 py-1.5 text-white/70 truncate max-w-[50px]" title={item.new_tyre?.serial_number}>
                    {item.new_tyre?.serial_number || '—'}
                  </td>
                  <td className="px-1 py-1.5">
                    {item.rtd !== null ? <RtdChip rtd={item.rtd} /> : <span className="text-white/40">—</span>}
                  </td>
                  <td className="px-1 py-1.5 text-right">
                    <button
                      onClick={() => onRemove(idx)}
                      className="p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
