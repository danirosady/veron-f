import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Save, RotateCcw, GripVertical, LayoutGrid, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TyreCanvasBase, { TYRE_IMAGE } from './TyreCanvasBase';
import DynamicFormationEditor from './DynamicFormationEditor';
import {
  generatePositionsFromFormation,
  extractFormationFromPositions,
  mirrorX,
} from '@/utils/formationUtils';

// ─── Compute mirror_of for all positions using distance from center ─────────────
// Inner/middle/outer pair semantics: furthest from center pairs together.

function computeMirrorOf(positions) {
  if (!positions?.length) return positions;

  // Group by axle
  const byAxle = {};
  positions.forEach(p => {
    if (!byAxle[p.axle]) byAxle[p.axle] = [];
    byAxle[p.axle].push(p);
  });

  const result = positions.map(p => ({ ...p }));

  Object.values(byAxle).forEach(axleTyres => {
    if (axleTyres.length < 2) return;
    // Sort by distance from center (largest first = outermost)
    const sorted = [...axleTyres].sort((a, b) => Math.abs(b.x - 0.5) - Math.abs(a.x - 0.5));
    for (let i = 0; i < sorted.length; i += 2) {
      const tyreA = result.find(p => p.position === sorted[i].position);
      const tyreB = result.find(p => p.position === sorted[i + 1]?.position);
      if (tyreA && tyreB) {
        tyreA.mirror_of = tyreB.position;
        tyreB.mirror_of = tyreA.position;
      }
    }
  });

  return result;
}

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

// ─── Editable Tyre Slot ────────────────────────────────────────────────────────

function EditableTyreSlot({ pos, isSelected, tyreWidth, tyreHeight, onSelect, onDragEnd }) {
  const elRef = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(pos);
    if (!elRef.current) return;

    const el = elRef.current;
    const overlay = el.parentElement;
    if (!overlay) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = pos.x;
    const startY = pos.y;
    const overlayW = overlay.offsetWidth;
    const overlayH = overlay.offsetHeight;

    const onMove = (me) => {
      const dx = (me.clientX - startMouseX) / overlayW;
      const dy = (me.clientY - startMouseY) / overlayH;
      const newX = Math.max(0.02, Math.min(0.98, startX + dx));
      const newY = Math.max(0.02, Math.min(0.98, startY + dy));
      el.style.left = `${newX * 100}%`;
      el.style.top = `${newY * 100}%`;
    };

    const onUp = (me) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (me.clientX - startMouseX) / overlayW;
      const dy = (me.clientY - startMouseY) / overlayH;
      const newX = Math.max(0.02, Math.min(0.98, startX + dx));
      const newY = Math.max(0.02, Math.min(0.98, startY + dy));
      el.style.left = `${newX * 100}%`;
      el.style.top = `${newY * 100}%`;
      onDragEnd(pos.position, newX, newY);
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
        zIndex: isSelected ? 20 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative flex items-center justify-center" style={{ width: tyreWidth, height: tyreHeight }}>
        <img
          src={TYRE_IMAGE}
          alt={pos.label}
          className="object-contain pointer-events-none select-none"
          style={{ width: tyreWidth, height: tyreHeight }}
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

// ─── Uncontrolled number input ──────────────────────────────────────────────────

function NumberInput({ value, onCommit, step = 0.01, min = 0, max = 1 }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || document.activeElement === el) return;
    el.value = value != null ? value.toFixed(3) : '0.50';
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="number"
      step={step}
      min={min}
      max={max}
      defaultValue={value != null ? value.toFixed(3) : '0.50'}
      onBlur={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onCommit(v);
        e.target.value = value != null ? value.toFixed(3) : '0.50';
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
      className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
    />
  );
}

// ─── Tyre Property Editor ───────────────────────────────────────────────────────

function TyrePropertyEditor({ pos, onUpdate, onDelete, onDeselect }) {
  if (!pos) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
        <Settings2 className="w-6 h-6 opacity-20" />
        <p className="text-xs text-center">Klik ban di canvas<br />untuk edit</p>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{pos.label}</span>
          {pos.mirror_of && (
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              mirror {pos.mirror_of}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDeselect} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="px-3 py-2 space-y-2">
        <div>
          <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Label</label>
          <input
            type="text"
            value={pos.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Side</label>
            <select
              value={pos.side}
              onChange={(e) => onUpdate({ side: e.target.value })}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {SIDE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Axle</label>
            <div className="px-2 py-1 border border-gray-100 rounded text-xs bg-gray-50 text-gray-500">{pos.axle}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">X</label>
            <NumberInput value={pos.x} onCommit={(v) => onUpdate({ x: v })} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Y</label>
            <NumberInput value={pos.y} onCommit={(v) => onUpdate({ y: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TyrePositionCanvasEditable({
  positions = [],
  maxPosition = 10,
  unitType = 'ADT_8POS',
  onSave,
  initialPositions = [],
}) {
  const derivedFormation = positions.length > 0
    ? extractFormationFromPositions(positions)
    : initialPositions.length > 0
      ? extractFormationFromPositions(initialPositions)
      : [
          { axle: 'poros_1', count: 0 },
          { axle: 'poros_3', count: 0 },
          { axle: 'poros_4', count: 0 },
        ];

  const [localPositions, setLocalPositions] = useState(() =>
    positions.length > 0
      ? computeMirrorOf([...positions].sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10)))
      : initialPositions.length > 0
        ? computeMirrorOf([...initialPositions].sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10)))
        : []
  );

  const [selectedPos, setSelectedPos] = useState(null);
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('formation');

  const userModified = useRef(false);

  const prevInitialKey = useRef(null);
  useEffect(() => {
    if (initialPositions.length === 0) return;
    const key = JSON.stringify(initialPositions.map(p => p.position));
    if (key === prevInitialKey.current) return;
    prevInitialKey.current = key;
    userModified.current = false;
    const sorted = computeMirrorOf([...initialPositions].sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10)));
    setLocalPositions(sorted);
    setFormation(extractFormationFromPositions(sorted));
  }, [initialPositions]);

  const [formation, setFormation] = useState(derivedFormation);

  const tyreWidth  = Math.max(100, Math.round(imageBounds.width * 0.25));
  const tyreHeight = Math.max(120, Math.round(tyreWidth * 1.15));

  const handleBoundsChange = useCallback((bounds) => {
    setImageBounds(bounds);
  }, []);

  // ── Mirror pairing ──────────────────────────────────────────────────────────
  // Uses mirror_of set at generation time (outer tyres pair with outer, inner with inner).

  const findMirror = (tyres, tyre) => {
    if (!tyre.mirror_of) return null;
    return tyres.find(p => p.position === tyre.mirror_of) || null;
  };

  // ── Drag ───────────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((posNum, newX, newY) => {
    setLocalPositions((prev) => {
      const thisTyre = prev.find(p => p.position === posNum);
      if (!thisTyre) return prev;
      const mirror = findMirror(prev, thisTyre);
      return prev.map((p) => {
        if (p.position === posNum) return { ...p, x: newX, y: newY };
        if (mirror && p.position === mirror.position) {
          return { ...p, mirror_of: p.mirror_of, x: mirrorX(newX), y: newY };
        }
        return p;
      });
    });
  }, []);

  // ── Formation change ────────────────────────────────────────────────────────

  const handleFormationChange = useCallback((newFormation) => {
    userModified.current = true;
    const generated = generatePositionsFromFormation(newFormation);

    const AXLE_ORDER = ['poros_1', 'poros_2', 'poros_3', 'poros_4', 'poros_5'];
    const axleRank = (p) => {
      const idx = AXLE_ORDER.indexOf(p.axle);
      return idx === -1 ? 99 : idx;
    };

    const sorted = [...generated].sort((a, b) => {
      const ao = axleRank(a) - axleRank(b);
      if (ao !== 0) return ao;
      return a.x - b.x;
    });

    const renumbered = sorted.map((p, i) => ({
      ...p,
      position: String(i + 1),
      label: `Tyre ${i + 1}`,
    }));

    const oldToNew = {};
    sorted.forEach((origTyre, i) => {
      oldToNew[origTyre.position] = renumbered[i].position;
    });

    const final = renumbered.map((newTyre, i) => ({
      ...newTyre,
      mirror_of: sorted[i].mirror_of ? oldToNew[sorted[i].mirror_of] : undefined,
    }));

    setFormation(newFormation);
    setLocalPositions(final);
    setActiveTab('formation');
  }, []);

  // ── Tyre property update ──────────────────────────────────────────────────

  const handleTyreUpdate = useCallback((updates) => {
    if (!selectedPos) return;
    setLocalPositions((prev) => {
      const thisTyre = prev.find(p => p.position === selectedPos);
      if (!thisTyre) return prev.map(p =>
        p.position === selectedPos ? { ...p, ...updates } : p
      );
      const mirror = findMirror(prev, thisTyre);
      return prev.map((p) => {
        if (p.position === selectedPos) return { ...p, ...updates };
        if (mirror && p.position === mirror.position) {
          return {
            ...p,
            mirror_of: p.mirror_of,
            x: updates.x !== undefined ? mirrorX(updates.x) : p.x,
            y: updates.y !== undefined ? updates.y : p.y,
          };
        }
        return p;
      });
    });
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
    setFormation(
      positions.length > 0 ? extractFormationFromPositions(positions)
      : initialPositions.length > 0 ? extractFormationFromPositions(initialPositions)
      : [
          { axle: 'poros_1', count: 0 },
          { axle: 'poros_3', count: 0 },
          { axle: 'poros_4', count: 0 },
        ]
    );
    setSelectedPos(null);
  };

  const selectedPosition = localPositions.find((p) => p.position === selectedPos);

  return (
    <div className="flex h-[520px] gap-0 rounded-xl overflow-hidden border border-gray-200">
      {/* ── Canvas area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          <span className="text-xs text-gray-500">{localPositions.length} ban</span>
          <div className="flex-1" />
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={() => onSave?.(localPositions)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
          >
            <Save className="w-3 h-3" />
            Simpan
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden height-[800px]">
          <TyreCanvasBase
            unitType={unitType}
            height={478}
            onBoundsChange={handleBoundsChange}
          >
            <div className="relative w-full h-full">
              {localPositions
                .slice()
                .sort((a, b) => {
                  const ao = a.axle.localeCompare(b.axle);
                  if (ao !== 0) return ao;
                  return a.x - b.x;
                })
                .map((pos) => (
                  <EditableTyreSlot
                    key={pos.position}
                    pos={pos}
                    isSelected={selectedPos === pos.position}
                    tyreWidth={tyreWidth}
                    tyreHeight={tyreHeight}
                    onSelect={(p) => {
                      setSelectedPos(p.position);
                      setActiveTab('properties');
                    }}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              {localPositions.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <LayoutGrid className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Belum ada formasi</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tab "Formasi" di kanan untuk atur jumlah ban
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TyreCanvasBase>

          <div className="absolute bottom-2 right-3 text-[9px] text-gray-400">
            Drag ban untuk reposisi
          </div>
        </div>
      </div>

      {/* ── Right sidebar ───────────────────────────────────────────── */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('formation')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors border-b-2',
              activeTab === 'formation'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Formasi
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors border-b-2',
              activeTab === 'properties'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Properti
            {selectedPos && (
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">
                {selectedPos}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'formation' ? (
            <DynamicFormationEditor
              formation={formation}
              maxPosition={maxPosition}
              onChange={handleFormationChange}
              onApply={handleFormationChange}
            />
          ) : (
            <TyrePropertyEditor
              pos={selectedPosition}
              onUpdate={handleTyreUpdate}
              onDelete={handleDelete}
              onDeselect={() => setSelectedPos(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
