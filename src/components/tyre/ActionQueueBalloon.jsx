import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const INPUT_CLASS = 'w-full px-3 py-2 pr-8 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 appearance-none';

function Select({ value, onChange, options = [], placeholder = 'Pilih...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const ref = useRef(null);
  const isInside = useRef(false);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const selectedLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      if (!isInside.current) setIsOpen(false);
      isInside.current = false;
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      requestAnimationFrame(() => {
        const btn = ref.current?.querySelector('button');
        if (btn) {
          const rect = btn.getBoundingClientRect();
          setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
      });
    }
    setIsOpen(o => !o);
  };

  const handleOptionMouseDown = () => {
    isInside.current = true;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={INPUT_CLASS + ' text-left flex items-center justify-between'}
        onClick={handleToggle}
      >
        <span className={value ? 'text-white' : 'text-white/40'}>{selectedLabel}</span>
        <svg className={`w-3.5 h-3.5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && createPortal(
        <div
          className="fixed z-[95] rounded-lg border border-white/20 bg-gray-900 shadow-xl overflow-y-auto"
          style={{ ...dropdownStyle, maxHeight: '192px' }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full px-3 py-2 text-xs text-left hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              onMouseDown={handleOptionMouseDown}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ActionQueueBalloon({
  queue = [],
  onRemove,
  onClearAll,
  onSubmitAll,
  isSubmitting = false,
  drivers = [],
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDriverConfirm, setShowDriverConfirm] = useState(false);
  const [confirmDriverId, setConfirmDriverId] = useState('');

  const handleSubmitClick = () => {
    setConfirmDriverId('');
    setShowDriverConfirm(true);
  };

  const handleConfirmSubmit = () => {
    onSubmitAll(confirmDriverId ? Number(confirmDriverId) : null);
    setShowDriverConfirm(false);
  };

  return (
    <>
      {/* Driver Confirm Balloon — portal to body */}
      {showDriverConfirm && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[80]"
            onClick={() => setShowDriverConfirm(false)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
            <div className="w-[360px] rounded-xl border border-white/20 shadow-2xl bg-black/80 backdrop-blur-xl text-white pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold">Konfirmasi Submit</span>
                </div>
                <button
                  onClick={() => setShowDriverConfirm(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-white/60">
                  Akan men-submit <strong className="text-white">{queue.length}</strong> aksi. Pilih driver:
                </p>
                <Select
                  value={confirmDriverId}
                  onChange={v => setConfirmDriverId(v)}
                  options={[{ value: '', label: 'Pilih driver...' }, ...drivers.map(d => ({ value: String(d.id), label: d.name }))]}
                />
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-4 py-3 border-t border-white/10">
                <button
                  onClick={() => setShowDriverConfirm(false)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold transition-colors"
                >
                  {isSubmitting ? '...' : `Submit (${queue.length})`}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Queue Balloon */}
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
            ? 'bg-black/80 backdrop-blur-xl'
            : 'bg-black/70 backdrop-blur-xl'
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
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={onClearAll}
                className="px-2 py-1 text-[10px] rounded border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting || queue.length === 0}
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
    </>
  );
}
