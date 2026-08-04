import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Save, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VEHICLE_CHASSIS_IMAGES } from '@/utils/vehicleLayouts';

const TYRE_IMAGE = '/tyre-pattern.png';

const AXLE_OPTIONS = [
  { value: 'front', label: 'Depan' },
  { value: 'bogie', label: 'Bogie / Tengah' },
  { value: 'rear_1', label: 'Belakang 1' },
  { value: 'rear_2', label: 'Belakang 2' },
  { value: 'rear', label: 'Belakang' },
];

const SIDE_OPTIONS = [
  { value: 'front_left', label: 'Front Left' },
  { value: 'front_right', label: 'Front Right' },
  { value: 'rear_left', label: 'Rear Left' },
  { value: 'rear_right', label: 'Rear Right' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const AXLE_Y = {
  front: 0.74,
  bogie: 0.50,
  rear_1: 0.26,
  rear_2: 0.20,
  rear: 0.26,
};

function getSlotZIndex(axle) {
  if (!axle) return 1;
  if (axle.includes('front')) return 4;
  if (axle.includes('bogie')) return 3;
  return 1;
}

// ─── Draggable Tyre Slot ───────────────────────────────────────────────────

function TyreSlot({ pos, isSelected, onSelect, onDragEnd }) {
  const z = getSlotZIndex(pos.axle);
  const dragRef = useRef(null);
  const elRef = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(pos.position);
    if (!elRef.current) return;

    const el = elRef.current;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = pos.x;
    const startY = pos.y;

    dragRef.current = true;

    const onMove = (me) => {
      if (!dragRef.current || !el) return;
      const dx = (me.clientX - startMouseX) / el.parentElement.offsetWidth;
      const dy = (me.clientY - startMouseY) / el.parentElement.offsetHeight;
      const newX = Math.max(0.02, Math.min(0.98, startX + dx));
      const newY = Math.max(0.02, Math.min(0.98, startY + dy));
      el.style.left = `${newX * 100}%`;
      el.style.top = `${newY * 100}%`;
    };

    const onUp = (me) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!dragRef.current || !el) return;
      dragRef.current = false;
      const dx = (me.clientX - startMouseX) / el.parentElement.offsetWidth;
      const dy = (me.clientY - startMouseY) / el.parentElement.offsetHeight;
      const newX = Math.max(0.02, Math.min(0.98, startX + dx));
      const newY = Math.max(0.02, Math.min(0.98, startY + dy));
      el.style.left = `${newX * 100}%`;
      el.style.top = `${newY * 100}%`;
      onDragEnd(pos.position, newX, newY, true);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={elRef}
      className={cn(
        'absolute cursor-grab active:cursor-grabbing select-none group transition-shadow',
        isSelected && 'z-20 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
      )}
      style={{
        left: `${pos.x * 100}%`,
        top: `${pos.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? z + 10 : z,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative flex items-center justify-center" style={{ width: 64, height: 72 }}>
        <img
          src={TYRE_IMAGE}
          alt={pos.label}
          className="object-contain pointer-events-none select-none"
          style={{ width: 60, height: 68 }}
          draggable={false}
        />
        <div
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-opacity',
            isSelected ? 'bg-primary-500 text-white opacity-100' : 'bg-gray-300 text-white opacity-0 group-hover:opacity-100'
          )}
        >
          <GripVertical className="w-3 h-3" />
        </div>
      </div>
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap',
          isSelected ? 'bg-primary-500 text-white' : 'bg-gray-800 text-white',
        )}
        style={{ bottom: -2 }}
      >
        {pos.label}
      </div>
    </div>
  );
}

// ─── Position Editor Panel ─────────────────────────────────────────────────

function PositionEditor({ pos, onUpdate, onDelete }) {
  if (!pos) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <GripVertical className="w-8 h-8 opacity-20" />
        <p className="text-xs">Klik ban di canvas untuk edit</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">{pos.label}</h4>
        <button onClick={onDelete} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Hapus">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <input
            type="text"
            value={pos.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Side</label>
            <select
              value={pos.side}
              onChange={(e) => onUpdate({ side: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {SIDE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Axle</label>
            <select
              value={pos.axle}
              onChange={(e) => {
                const newAxle = e.target.value;
                onUpdate({ axle: newAxle, y: AXLE_Y[newAxle] || 0.5 });
              }}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {AXLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">X ({((pos.x || 0) * 100).toFixed(0)}%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={pos.x?.toFixed(2) || '0.50'}
              onChange={(e) => onUpdate({ x: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Y ({((pos.y || 0) * 100).toFixed(0)}%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={pos.y?.toFixed(2) || '0.50'}
              onChange={(e) => onUpdate({ y: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tyre Overlay ──────────────────────────────────────────────────────────

function TyreOverlay({ positions, selectedPos, onSelect, onDragEnd }) {
  return (
    <div className="absolute inset-0">
      {positions.map((pos) => (
        <TyreSlot
          key={pos.position}
          pos={pos}
          isSelected={selectedPos === pos.position}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function TyrePositionCanvasEditable({
  positions = [],
  maxPosition = 10,
  unitType = 'ADT_8POS',
  onSave,
  initialPositions = [],
}) {
  const [localPositions, setLocalPositions] = useState(positions.length > 0 ? positions : initialPositions);
  const [selectedPos, setSelectedPos] = useState(null);
  const isDirtyRef = useRef(false);
  const chassisImage = VEHICLE_CHASSIS_IMAGES[unitType] || null;

  useEffect(() => {
    if (!isDirtyRef.current) {
      setLocalPositions(positions.length > 0 ? positions : initialPositions);
    }
  }, [positions, initialPositions]);

  const handleAddPosition = () => {
    const nextNum = localPositions.length + 1;
    if (nextNum > maxPosition) return;
    const counts = {};
    localPositions.forEach((p) => {
      const a = p.axle || 'rear';
      counts[a] = (counts[a] || 0) + 1;
    });
    const axle = 'rear_1';
    const count = counts[axle] || 0;
    const side = count % 2 === 0 ? 'rear_left' : 'rear_right';
    const col = Math.floor(count / 2);
    const x = side === 'rear_left' ? 0.18 + col * 0.12 : 0.82 - col * 0.12;
    const y = AXLE_Y[axle];
    setLocalPositions((prev) => [
      ...prev,
      { position: String(nextNum), label: `Pos ${nextNum}`, side, axle, x, y },
    ]);
    setSelectedPos(String(nextNum));
  };

  const handleDragEnd = useCallback((posNum, newX, newY, commit) => {
    if (!commit) return;
    isDirtyRef.current = true;
    setLocalPositions((prev) =>
      prev.map((p) =>
        p.position === posNum ? { ...p, x: newX, y: newY } : p
      )
    );
  }, []);

  const handleUpdate = useCallback((updates) => {
    if (!selectedPos) return;
    isDirtyRef.current = true;
    setLocalPositions((prev) =>
      prev.map((p) =>
        p.position === selectedPos ? { ...p, ...updates } : p
      )
    );
  }, [selectedPos]);

  const handleDelete = useCallback(() => {
    if (!selectedPos) return;
    setLocalPositions((prev) => {
      const filtered = prev.filter((p) => p.position !== selectedPos);
      return filtered.map((p, i) => ({ ...p, position: String(i + 1) }));
    });
    setSelectedPos(null);
  }, [selectedPos]);

  const handleReset = () => {
    setLocalPositions(positions.length > 0 ? [...positions] : [...initialPositions]);
    setSelectedPos(null);
    isDirtyRef.current = false;
  };

  const selectedPosition = localPositions.find((p) => p.position === selectedPos);

  return (
    <div className="flex h-[520px] gap-0 rounded-xl overflow-hidden border border-gray-200">
      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={handleAddPosition}
            disabled={localPositions.length >= maxPosition}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              localPositions.length >= maxPosition
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Ban
          </button>
          <span className="text-xs text-gray-400">{localPositions.length}/{maxPosition}</span>
          <div className="flex-1" />
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={() => onSave?.(localPositions)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan
          </button>
        </div>

        {/* Canvas: both image and tyres share the same percentage coordinate space */}
        <div
          className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-50 to-gray-100"
          onClick={(e) => {
            const t = e.target;
            if (t.tagName === 'IMG' || t.tagName === 'svg' || t.tagName === 'rect') {
              setSelectedPos(null);
            }
          }}
        >
          {chassisImage ? (
            <img
              src={chassisImage}
              alt="Chassis"
              className="absolute inset-0 w-full h-full p-4"
              style={{ objectFit: 'contain', opacity: 0.85 }}
              draggable={false}
            />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full p-4"
              style={{ opacity: 0.12 }}
            >
              <rect x="10" y="15" width="80" height="62" rx="8" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
              <rect x="30" y="5" width="40" height="13" rx="5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
              <rect x="34" y="6" width="32" height="6" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.5" />
            </svg>
          )}

          {/* Tyre overlay: same container as image, percentage positions */}
          <TyreOverlay
            positions={localPositions}
            selectedPos={selectedPos}
            onSelect={(p) => setSelectedPos(p)}
            onDragEnd={handleDragEnd}
          />

          {localPositions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Tidak ada ban</p>
                <p className="text-xs text-gray-400 mt-1">Klik "Tambah Ban" untuk mulai</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 right-3 text-[9px] text-gray-400">
            Drag untuk reposisi · Klik untuk edit
          </div>
        </div>
      </div>

      {/* Editor panel */}
      <div className="w-56 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-700">Properti Ban</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PositionEditor
            pos={selectedPosition}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
