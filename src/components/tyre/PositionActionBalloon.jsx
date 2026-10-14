import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, RefreshCw, UserCheck } from 'lucide-react';
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

function Select({ value, onChange, options = [], placeholder = 'Pilih...', children, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const sourceOptions = options.length > 0
    ? options
    : React.Children.toArray(children)
        .filter(React.isValidElement)
        .map(child => ({ value: String(child.props.value ?? ''), label: child.props.children }));

  const filtered = search
    ? sourceOptions.filter(opt => String(opt.label ?? '').toLowerCase().includes(search.toLowerCase()))
    : sourceOptions;

  const selected = sourceOptions.find(opt => String(opt.value) === String(value));
  const selectedLabel = selected?.label ?? placeholder;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setIsOpen(false); setSearch(''); } };
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
        <span className={value ? 'text-white truncate' : 'text-white/40'}>{selectedLabel}</span>
        <svg className={`w-3.5 h-3.5 text-white/50 transition-transform flex-shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/20 bg-gray-900 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
              placeholder="Cari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40 text-center">Tidak ada hasil</div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.value || i}
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-xs text-left flex items-center gap-2 transition-colors',
                    String(opt.value) === String(value)
                      ? 'bg-primary-500/20 text-primary-200'
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  )}
                  onClick={() => { onChange({ target: { value: opt.value } }); setIsOpen(false); setSearch(''); }}
                >
                  {String(opt.value) === String(value) && (
                    <svg className="w-3 h-3 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={String(opt.value) === String(value) ? '' : 'pl-5'}>{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelectSearchable({ options = [], value = [], onChange, placeholder = 'Cari tyreman...', searchPlaceholder = 'Ketik nama...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const filtered = options.filter(opt =>
    opt.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setIsOpen(false); setSearch(''); } };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger — shows selected chips */}
      <button
        type="button"
        className={INPUT_CLASS + ' text-left min-h-[42px] flex flex-wrap items-center gap-1 cursor-pointer'}
        onClick={() => setIsOpen(o => !o)}
      >
        {value.length === 0 ? (
          <span className="text-white/40">{placeholder}</span>
        ) : (
          options
            .filter(opt => value.includes(opt.id))
            .map(opt => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-500/30 border border-primary-400 text-primary-200"
              >
                {opt.name}
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-primary-400/40 cursor-pointer leading-none ml-0.5"
                  onClick={(e) => { e.stopPropagation(); toggle(opt.id); }}
                >
                  ×
                </span>
              </span>
            ))
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/20 bg-gray-900 shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40 text-center">Tidak ada hasil</div>
            ) : (
              filtered.map(opt => {
                const isSelected = value.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    onClick={() => toggle(opt.id)}
                  >
                    <span className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-white/30'
                    )}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>{opt.name}</span>
                  </button>
                );
              })
            )}
          </div>
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
  currentLifeHm,
  remarksInput,
  dismountCondition,
  spareTyres,
  unitCurrentHm,
  reasons = [],
  reasonId,
  rtdError,
  tyremen = [],
  tyresmanIds = [],
  tyresmanRequired = false,
  onTyresmanIdsChange,
  onStepChange,
  onSpareTyreIdChange,
  onRtdInputChange,
  onCurrentLifeHmChange,
  onRemarksInputChange,
  onDismountConditionChange,
  onReasonChange,
  onClose,
  onAddToQueue,
  queueAddDisabled,
}) {
  if (!isOpen) return null;

  const mountedTyre = tyre;
  const selectedSpareTyre = spareTyres.find(t => String(t.id) === spareTyreId);

  // Auto-populate RTD based on step:
  // - Mount: from spare tyre's current RTD
  // - Swap: from mounted tyre's current RTD
  // - Unmount: user inputs measured RTD (null = manual input)
  const getAutoRtd = () => {
    if (step === 'mount-form' && selectedSpareTyre) {
      return selectedSpareTyre.rtd || selectedSpareTyre.rtd_1 || '';
    }
    if (step === 'swap-form' && mountedTyre) {
      return mountedTyre.rtd || mountedTyre.rtd_1 || '';
    }
    return '';
  };

  const autoRtd = getAutoRtd();
  const rtdPlaceholder = mountedTyre?.rtd || mountedTyre?.rtd_1 || selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 || '';
  const previousRTD = mountedTyre?.rtd || mountedTyre?.rtd_1 || 0;
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

            {/* Mount form — Ban Baru */}
            {step === 'mount-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Ban Spare <span className="text-red-400">*</span></label>
                  <Select
                    value={spareTyreId}
                    placeholder="Pilih ban spare..."
                    options={[{ value: '', label: 'Pilih ban spare...' }, ...spareTyres.map(t => ({
                      value: String(t.id),
                      label: `${t.serial_number} — ${t.brand?.name || ''} ${t.size?.name || ''} (RTD: ${t.rtd || t.rtd_1 || '—'}mm)`,
                    }))]}
                    onChange={e => {
                      onSpareTyreIdChange(e.target.value);
                      const selected = spareTyres.find(t => String(t.id) === e.target.value);
                      if (selected) {
                        const tyreRtd = selected.rtd || selected.rtd_1 || selected.original_tyre_depth || '';
                        onRtdInputChange(String(tyreRtd));
                        const tyreHm = selected.current_hm || selected.current_life_hm || selected.lifetime || '';
                        onCurrentLifeHmChange(String(tyreHm));
                      }
                    }}
                    required
                  />
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
                    <label className={LABEL_CLASS}>RTD (mm) <span className="text-green-400">(auto)</span></label>
                    <div className={INPUT_CLASS + ' bg-green-500/10 border-green-500/30 cursor-not-allowed'}>
                      {rtdInput || selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 || selectedSpareTyre?.original_tyre_depth || '-'}
                    </div>
                    <p className="text-[9px] text-green-400/70 mt-0.5">
                      Dari RTD ban: {rtdInput || selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 || selectedSpareTyre?.original_tyre_depth || 'OTD'}mm
                    </p>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM <span className="text-green-400">(auto)</span></label>
                    <div className={INPUT_CLASS + ' bg-green-500/10 border-green-500/30 cursor-not-allowed'}>
                      {currentLifeHm || '-'}
                    </div>
                    <p className="text-[9px] text-green-400/70 mt-0.5">Dari history ban</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks <span className="text-white/40">(opsional)</span></label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan..."
                  />
                </div>
                {/* Tyreman selection */}
                {tyremen.length > 0 && (
                  <div>
                    <label className={LABEL_CLASS}>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Tyreman(s) {tyresmanRequired ? <span className="text-red-400">*</span> : <span className="text-white/40">(opsional)</span>}
                      </span>
                    </label>
                    <MultiSelectSearchable
                      options={tyremen}
                      value={tyresmanIds}
                      onChange={onTyresmanIdsChange}
                      placeholder="Pilih tyreman..."
                      searchPlaceholder="Ketik nama tyreman..."
                    />
                    {tyresmanRequired && tyresmanIds.length === 0 && (
                      <p className="text-[10px] text-red-400 mt-0.5">Tyreman wajib dipilih</p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-white/50 italic">
                  * HM Reading & Lokasi akan diinput saat proses submit
                </p>
              </div>
            )}

            {/* Unmount form — Lepas Ban */}
            {step === 'unmount-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Kondisi Setelah Lepas</label>
                  <Select
                    value={dismountCondition}
                    options={[
                      { value: 'spare', label: 'Spare (bisa dipakai lagi)' },
                      { value: 'scrap', label: 'Scrap (dibuang)' },
                    ]}
                    onChange={e => onDismountConditionChange(e.target.value)}
                  />
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  <p className="text-[10px] text-red-300 font-medium mb-2">Ban yang akan dilepas:</p>
                  <div className="flex items-center gap-2">
                    <TyreIcon className="w-5 h-5 text-red-400/70" />
                    <div>
                      <div className="text-xs font-semibold text-red-200">{mountedTyre?.serial_number || '-'}</div>
                      <div className="text-[10px] text-red-400/70">{mountedTyre?.brand?.name} {mountedTyre?.size?.name}</div>
                    </div>
                    <span className="ml-auto text-[10px] text-red-300">
                      RTD lama: {mountedTyre?.rtd || mountedTyre?.rtd_1 || '-'}mm
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>RTD Terukur (mm) <span className="text-yellow-400">(input)</span></label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rtdInput}
                      onChange={e => onRtdInputChange(e.target.value)}
                      placeholder="Ukur RTD ban"
                    />
                    <p className="text-[9px] text-yellow-400/70 mt-0.5">Input manual: ukur RTD ban</p>
                    {rtdError && (
                      <p className="text-[10px] text-red-400 mt-0.5">{rtdError}</p>
                    )}
                    {!rtdInput && (
                      <p className="text-[9px] text-red-400 mt-0.5">RTD wajib diisi</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM <span className="text-green-400">(auto)</span></label>
                    <div className={INPUT_CLASS + ' bg-green-500/10 border-green-500/30 cursor-not-allowed'}>
                      {mountedTyre?.current_hm || mountedTyre?.current_life_hm || mountedTyre?.lifetime || '-'}
                    </div>
                    <p className="text-[9px] text-green-400/70 mt-0.5">Dari history ban</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Alasan Replacement <span className="text-red-400">*</span></label>
                  <Select
                    value={reasonId || ''}
                    placeholder="Pilih alasan..."
                    options={[{ value: '', label: 'Pilih alasan...' }, ...reasons.map(r => ({ value: String(r.id), label: r.name }))]}
                    onChange={e => onReasonChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks <span className="text-white/40">(opsional)</span></label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan..."
                  />
                </div>
                {/* Tyreman selection */}
                {tyremen.length > 0 && (
                  <div>
                    <label className={LABEL_CLASS}>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Tyreman(s) {tyresmanRequired ? <span className="text-red-400">*</span> : <span className="text-white/40">(opsional)</span>}
                      </span>
                    </label>
                    <MultiSelectSearchable
                      options={tyremen}
                      value={tyresmanIds}
                      onChange={onTyresmanIdsChange}
                      placeholder="Pilih tyreman..."
                      searchPlaceholder="Ketik nama tyreman..."
                    />
                    {tyresmanRequired && tyresmanIds.length === 0 && (
                      <p className="text-[10px] text-red-400 mt-0.5">Tyreman wajib dipilih</p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-white/50 italic">
                  * Lokasi dan Supervisor akan diinput saat proses queue
                </p>
              </div>
            )}

            {/* Swap form */}
            {step === 'swap-form' && (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Ban Spare Baru <span className="text-red-400">*</span></label>
                  <Select
                    value={spareTyreId}
                    placeholder="Pilih ban spare..."
                    options={[{ value: '', label: 'Pilih ban spare...' }, ...spareTyres.map(t => ({
                      value: String(t.id),
                      label: `${t.serial_number} — ${t.brand?.name || ''} ${t.size?.name || ''} (RTD: ${t.rtd || t.rtd_1 || '—'}mm)`,
                    }))]}
                    onChange={e => onSpareTyreIdChange(e.target.value)}
                    required
                  />
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
                <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                  <p className="text-[10px] text-yellow-300 font-medium mb-2">Ban Lama (akan dilepas):</p>
                  <div className="flex items-center gap-2">
                    <TyreIcon className="w-5 h-5 text-yellow-400/70" />
                    <div>
                      <div className="text-xs font-semibold text-yellow-200">{mountedTyre?.serial_number || '-'}</div>
                      <div className="text-[10px] text-yellow-400/70">{mountedTyre?.brand?.name} {mountedTyre?.size?.name}</div>
                    </div>
                    <span className="ml-auto text-[10px] text-yellow-300">
                      RTD: {mountedTyre?.rtd || mountedTyre?.rtd_1 || '-'}mm
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASS}>RTD Ban Lama (mm) <span className="text-yellow-400">(input)</span></label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rtdInput}
                      onChange={e => onRtdInputChange(e.target.value)}
                      placeholder="Ukur RTD ban lama"
                    />
                    <p className="text-[9px] text-yellow-400/70 mt-0.5">Input manual: ukur RTD ban lama</p>
                    {rtdError && (
                      <p className="text-[10px] text-red-400 mt-0.5">{rtdError}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Current Life HM <span className="text-green-400">(auto)</span></label>
                    <div className={INPUT_CLASS + ' bg-green-500/10 border-green-500/30 cursor-not-allowed'}>
                      {mountedTyre?.current_hm || mountedTyre?.current_life_hm || mountedTyre?.lifetime || '-'}
                    </div>
                    <p className="text-[9px] text-green-400/70 mt-0.5">Dari history ban lama</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Alasan Replacement <span className="text-red-400">*</span></label>
                  <Select
                    value={reasonId || ''}
                    placeholder="Pilih alasan..."
                    options={[{ value: '', label: 'Pilih alasan...' }, ...reasons.map(r => ({ value: String(r.id), label: r.name }))]}
                    onChange={e => onReasonChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Remarks <span className="text-white/40">(opsional)</span></label>
                  <Textarea
                    rows={2}
                    value={remarksInput}
                    onChange={e => onRemarksInputChange(e.target.value)}
                    placeholder="Catatan..."
                  />
                </div>
                {/* Tyreman selection */}
                {tyremen.length > 0 && (
                  <div>
                    <label className={LABEL_CLASS}>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Tyreman(s) {tyresmanRequired ? <span className="text-red-400">*</span> : <span className="text-white/40">(opsional)</span>}
                      </span>
                    </label>
                    <MultiSelectSearchable
                      options={tyremen}
                      value={tyresmanIds}
                      onChange={onTyresmanIdsChange}
                      placeholder="Pilih tyreman..."
                      searchPlaceholder="Ketik nama tyreman..."
                    />
                    {tyresmanRequired && tyresmanIds.length === 0 && (
                      <p className="text-[10px] text-red-400 mt-0.5">Tyreman wajib dipilih</p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-white/50 italic">
                  * Lokasi dan Supervisor akan diinput saat proses submit
                </p>
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
