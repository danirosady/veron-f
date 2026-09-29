import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, RefreshCw } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/format';

const INPUT_CLASS = 'w-full px-3 py-2 pr-8 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 appearance-none';
const LABEL_CLASS = 'block text-[11px] font-medium text-white/70 mb-1';

function Input({ value, onChange, ...rest }) {
  return (
    <input
      className={INPUT_CLASS}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
}

function Select({ value, onChange, children, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const raw = React.Children.toArray(children);
  const childrenArray = raw.filter(React.isValidElement);
  const selectedChild = childrenArray.find(c => String(c?.props?.value ?? '') === String(value));
  const selectedLabel = selectedChild?.props?.children ?? 'Pilih...';

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={INPUT_CLASS + ' text-left flex items-center justify-between'}
        onClick={() => setIsOpen(o => !o)}
        {...rest}
      >
        <span className={value ? 'text-white' : 'text-white/40'}>{selectedLabel}</span>
        <svg className={`w-3.5 h-3.5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && childrenArray.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/20 bg-gray-900 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {childrenArray.map((child, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-3 py-2 text-xs text-left hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              onClick={() => { onChange({ target: { value: String(child.props.value) } }); setIsOpen(false); }}
            >
              {child.props.children}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Textarea({ value, onChange, ...rest }) {
  return (
    <textarea
      className={cn(INPUT_CLASS, 'resize-none')}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
}

export default function PositionActionBalloon({
  isOpen,
  position,
  tyre,
  step,
  spareTyreId,
  rtdInput,
  hmInput,
  currentLifeHm,
  hmPlan,
  remarksInput,
  dismountCondition,
  spareTyres,
  unitCurrentHm,
  onStepChange,
  onSpareTyreIdChange,
  onRtdInputChange,
  onHmInputChange,
  onCurrentLifeHmChange,
  onHmPlanChange,
  onRemarksInputChange,
  onDismountConditionChange,
  onClose,
  onAddToQueue,
  queueAddDisabled,
}) {
  if (!isOpen) return null;

  const mountedTyre = tyre;
  const selectedSpareTyre = spareTyres.find(t => String(t.id) === spareTyreId);
  const rtdPlaceholder = mountedTyre?.rtd || mountedTyre?.rtd_1 || selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 || '';
  const canAddToQueue = !queueAddDisabled;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[80]"
        onClick={onClose}
      />
      {/* Centered wrapper */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
        <div
          className="w-[420px] flex flex-col rounded-xl border border-white/20 shadow-2xl bg-black/80 backdrop-blur-xl text-white pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <TyreIcon className="w-4 h-4 text-white/60" />
              <span className="text-sm font-semibold">Posisi #{position}</span>
              {mountedTyre ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/40">
                  Mounted
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60 border border-white/20">
                  Empty
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Mounted tyre info */}
            {mountedTyre && (
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1.5">Currently Mounted</p>
                <div className="flex items-center gap-2">
                  <TyreIcon className="w-5 h-5 text-white/50" />
                  <div>
                    <div className="text-xs font-semibold">{mountedTyre.serial_number || '—'}</div>
                    <div className="text-[10px] text-white/50">{mountedTyre.brand?.name} {mountedTyre.size?.name}</div>
                  </div>
                  {mountedTyre.rtd != null && (
                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/80">
                      RTD: {formatNumber(mountedTyre.rtd || mountedTyre.rtd_1, 1)}mm
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Choose step — only for occupied slots */}
            {step === 'choose' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onStepChange('unmount-form')}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-red-400/50 text-white transition-all"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-xs font-semibold">Unmount</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStepChange('swap-form')}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-yellow-400/50 text-white transition-all"
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="text-xs font-semibold">Swap</span>
                </button>
              </div>
            )}

            {/* Mount form */}
            {step === 'mount-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Ban Spare <span className="text-red-400">*</span></label>
                  <Select
                    value={spareTyreId}
                    onChange={e => onSpareTyreIdChange(e.target.value)}
                    required
                  >
                    <option value="">Pilih ban spare...</option>
                    {spareTyres.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.serial_number} — {t.brand?.name || ''} {t.size?.name || ''} (RTD: {t.rtd || t.rtd_1 || '—'}mm)
                      </option>
                    ))}
                  </Select>
                </div>
                {selectedSpareTyre && (
                  <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20 flex items-center gap-2">
                    <TyreIcon className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-xs font-semibold text-green-300">{selectedSpareTyre.serial_number}</div>
                      <div className="text-[10px] text-green-400/70">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>RTD (mm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rtdInput}
                      onChange={e => onRtdInputChange(e.target.value)}
                      placeholder={rtdPlaceholder ? String(rtdPlaceholder) : ''}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Reading</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmInput}
                      onChange={e => onHmInputChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={e => onCurrentLifeHmChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : '0'}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Plan</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={e => onHmPlanChange(e.target.value)}
                      placeholder="Target HM"
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks</label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan opsional..."
                  />
                </div>
              </div>
            )}

            {/* Unmount form */}
            {step === 'unmount-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Kondisi Setelah Lepas</label>
                  <Select
                    value={dismountCondition}
                    onChange={e => onDismountConditionChange(e.target.value)}
                  >
                    <option value="spare">Spare (bisa dipakai lagi)</option>
                    <option value="scrap">Scrap (dibuang)</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>RTD Terukur (mm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rtdInput}
                      onChange={e => onRtdInputChange(e.target.value)}
                      placeholder={rtdPlaceholder ? String(rtdPlaceholder) : ''}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Reading</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmInput}
                      onChange={e => onHmInputChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={e => onCurrentLifeHmChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : '0'}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Plan</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={e => onHmPlanChange(e.target.value)}
                      placeholder="Target HM"
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks</label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan opsional..."
                  />
                </div>
              </div>
            )}

            {/* Swap form */}
            {step === 'swap-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Ban Spare Baru <span className="text-red-400">*</span></label>
                  <Select
                    value={spareTyreId}
                    onChange={e => onSpareTyreIdChange(e.target.value)}
                    required
                  >
                    <option value="">Pilih ban spare...</option>
                    {spareTyres.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.serial_number} — {t.brand?.name || ''} {t.size?.name || ''} (RTD: {t.rtd || t.rtd_1 || '—'}mm)
                      </option>
                    ))}
                  </Select>
                </div>
                {selectedSpareTyre && (
                  <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20 flex items-center gap-2">
                    <TyreIcon className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-xs font-semibold text-green-300">{selectedSpareTyre.serial_number}</div>
                      <div className="text-[10px] text-green-400/70">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>RTD (mm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rtdInput}
                      onChange={e => onRtdInputChange(e.target.value)}
                      placeholder={rtdPlaceholder ? String(rtdPlaceholder) : ''}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Reading</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmInput}
                      onChange={e => onHmInputChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={e => onCurrentLifeHmChange(e.target.value)}
                      placeholder={unitCurrentHm ? String(unitCurrentHm) : '0'}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HM Plan</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={e => onHmPlanChange(e.target.value)}
                      placeholder="Target HM"
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks</label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan opsional..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer — Add to Queue */}
          {(step === 'mount-form' || step === 'unmount-form' || step === 'swap-form') && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
              <button
                type="button"
                onClick={onAddToQueue}
                disabled={!canAddToQueue}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah ke Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </>
    ,
    document.body
  );
}
