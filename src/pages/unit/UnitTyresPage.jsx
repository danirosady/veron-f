import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  CircleDot,
  Gauge,
  RefreshCw,
  Edit3,
  Eye,
  GripVertical,
} from 'lucide-react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/form/FormField';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvas from '@/components/tyre/TyrePositionCanvas';
import { unitsAPI } from '@/api/units';
import { replacementsAPI } from '@/api/replacements';
import { masterAPI } from '@/api/master';
import { driversAPI } from '@/api/drivers';
import { formatNumber, titleCase, getRtdColor } from '@/utils/format';
import { VEHICLE_CHASSIS_IMAGES } from '@/utils/vehicleLayouts';

// ─── RTD Chip ────────────────────────────────────────────────────────────────

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const color = getRtdColor(rtd);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${color === '#22c55e' ? 'bg-green-100 text-green-700 border-green-200' : color === '#eab308' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : color === '#f97316' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
      {formatNumber(rtd, 1)}mm
    </span>
  );
}

// ─── Tyre Image ───────────────────────────────────────────────────────────────

function TyreImg({ size = 48, opacity = 1 }) {
  return (
    <img
      src="/tyre-pattern.png"
      alt="Tyre"
      className="object-contain select-none pointer-events-none"
      style={{ width: size, height: size * 1.15, opacity }}
      draggable={false}
    />
  );
}

// ─── Draggable Spare Tyre Card ───────────────────────────────────────────────

function SpareTyreCard({ tyre, isSelected, onSelect }) {
  const rtd = tyre.rtd || tyre.rtd_1;
  const rtdColor = getRtdColor(rtd);
  const brand = tyre.brand?.name || tyre.brand_name;
  const size = tyre.size?.name || tyre.size_name;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `spare-${tyre.id}`,
    data: { type: 'SPARE_TYRE', tyre },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 9999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      className={`
        w-full text-left p-2 rounded-lg border cursor-grab transition-all duration-150
        ${isDragging ? 'opacity-30 scale-95' : ''}
        ${isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'}
        active:cursor-grabbing
      `}
      onClick={() => !isDragging && onSelect?.(tyre)}
    >
      <div className="flex items-center gap-2">
        <TyreImg size={36} opacity={0.7} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 text-xs truncate">
              {tyre.serial_number || '—'}
            </span>
            {isSelected && (
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-400 truncate">{brand} {size}</div>
        </div>
        {rtd != null && (
          <div className="flex-shrink-0 text-right">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-0.5">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (rtd / 30) * 100)}%`, backgroundColor: rtdColor }}
              />
            </div>
            <span className="text-[9px] font-medium" style={{ color: rtdColor }}>{formatNumber(rtd, 1)}mm</span>
          </div>
        )}
        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── Spare Panel (Drop Zone) ─────────────────────────────────────────────────

function SparePanel({ tyres, search, onSearch, onSelect, selectedTyreId, isDragOver, onDragEnter, onDragLeave }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'spare-panel',
    data: { type: 'SPARE_PANEL' },
  });

  const activeOver = isDragOver || isOver;

  const filteredTyres = useMemo(() => {
    if (!search.trim()) return tyres;
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
      className={`
        rounded-xl border transition-all duration-200
        ${activeOver ? 'border-primary-400 bg-primary-50 border-dashed' : 'border-gray-200 bg-white'}
      `}
    >
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            Spare Tyres ({tyres.length})
          </span>
          {activeOver && (
            <span className="text-[10px] text-primary-600 font-medium animate-pulse">
              Lepas di sini untuk unmount
            </span>
          )}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari barcode, SN, brand..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="p-3 space-y-1.5 max-h-[360px] overflow-y-auto">
        {filteredTyres.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
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
  );
}

// ─── Drag Overlay Cards ────────────────────────────────────────────────────────

function SpareTyreOverlay({ tyre }) {
  const rtd = tyre?.rtd || tyre?.rtd_1;
  const rtdColor = getRtdColor(rtd);
  return (
    <div className="flex items-center gap-2 bg-white border-2 border-primary-400 rounded-xl px-4 py-3 shadow-2xl shadow-primary-200/50 min-w-[180px]">
      <TyreImg size={48} opacity={0.9} />
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate">{tyre.serial_number || '—'}</div>
        <div className="text-xs text-gray-500 truncate">
          {tyre.brand?.name || tyre.brand_name}
        </div>
        {rtd != null && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (rtd / 30) * 100)}%`, backgroundColor: rtdColor }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: rtdColor }}>{formatNumber(rtd, 1)}mm</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MountedTyreOverlay({ tyre, label }) {
  const rtd = tyre?.rtd || tyre?.rtd_1;
  const rtdColor = getRtdColor(rtd);
  return (
    <div className="flex items-center gap-2 bg-white border-2 border-primary-400 rounded-xl px-4 py-3 shadow-2xl shadow-primary-200/50 min-w-[180px]">
      <TyreImg size={48} opacity={0.9} />
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate">{label}</div>
        <div className="text-xs text-gray-500 truncate">{tyre.serial_number || '—'}</div>
        {rtd != null && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (rtd / 30) * 100)}%`, backgroundColor: rtdColor }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: rtdColor }}>{formatNumber(rtd, 1)}mm</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Find the nearest position slot to (nx, ny) where nx/ny are [0,1] canvas coords */
function findPositionAtCoords(positions, nx, ny) {
  let best = null;
  let bestDist = Infinity;
  for (const pos of positions) {
    if (pos.x == null || pos.y == null) continue;
    const d = Math.hypot(pos.x - nx, pos.y - ny);
    if (d < bestDist) { bestDist = d; best = pos; }
  }
  // Only match if within a reasonable radius (e.g. 8% of canvas diagonal)
  const threshold = 0.08;
  return bestDist < threshold ? best : null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function UnitTyresPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTyre, setSelectedTyre] = useState(null);
  const [actionQueue, setActionQueue] = useState([]);
  const [searchSpare, setSearchSpare] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [isSparePanelDragOver, setIsSparePanelDragOver] = useState(false);
  const [isDraggingSpare, setIsDraggingSpare] = useState(false);
  const canvasOverlayRef = useRef({});

  // Action form state
  const [action, setAction] = useState('');
  const [spareTyreId, setSpareTyreId] = useState('');
  const [rtdInput, setRtdInput] = useState('');
  const [hmInput, setHmInput] = useState('');
  const [replacementDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarksInput, setRemarksInput] = useState('');
  const [driverId, setDriverId] = useState('');
  const [currentLifeHm, setCurrentLifeHm] = useState('');
  const [hmPlan, setHmPlan] = useState('');
  const [dismountCondition, setDismountCondition] = useState('spare');

  // Fetch unit tyres data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['unit-tyres', id],
    queryFn: () => unitsAPI.getTyres(id),
    enabled: Boolean(id),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { all: true }],
    queryFn: () => driversAPI.list({ per_page: 200 }),
  });

  const unitData = data?.data?.data;
  const unit = unitData?.unit;
  const positions = unitData?.positions || [];
  const spareTyres = unitData?.spare_tyres || [];
  const unitTypeConfig = unitData?.unit_type_config;
  const totalMounted = unitData?.total_mounted || 0;
  const totalSpare = unitData?.total_spare || 0;
  const drivers = driversData?.data?.data || driversData?.data || [];

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Direct submit mutation
  const submitMutation = useMutation({
    mutationFn: (payload) => replacementsAPI.create({
      unit_id: Number(id),
      driver_id: driverId ? Number(driverId) : null,
      date: replacementDate,
      hm_update: hmInput ? Number(hmInput) : 0,
      current_life_hm: currentLifeHm ? Number(currentLifeHm) : (unit?.current_hm || 0),
      hm_plan: hmPlan ? Number(hmPlan) : 0,
      remarks: remarksInput || null,
      details: [{
        position: selectedPosition,
        action: action,
        old_tyre_id: selectedTyre?.id || null,
        new_tyre_id: action !== 'dismount' ? Number(spareTyreId) : null,
        old_tyre_tread_1: rtdInput ? Number(rtdInput) : null,
        old_tyre_tread_2: rtdInput ? Number(rtdInput) : null,
        new_tyre_status: action === 'dismount' ? dismountCondition : '',
        remark: remarksInput || '',
      }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
      closeActionModal();
    },
  });

  // Batch submit mutation
  const batchSubmitMutation = useMutation({
    mutationFn: ({ details, driver_id, hm_plan, current_life_hm }) => replacementsAPI.create({
      unit_id: Number(id),
      driver_id,
      date: replacementDate,
      hm_update: hmInput ? Number(hmInput) : 0,
      current_life_hm,
      hm_plan,
      remarks: remarksInput || null,
      details,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
      setActionQueue([]);
      closeActionModal();
    },
  });

  // Save template mutation (edit mode)
  const saveTemplateMutation = useMutation({
    mutationFn: ({ id: tid, positions: pos }) => masterAPI.updateUnitType(tid, {
      unit_type: unitTypeConfig.unit_type,
      display_name: unitTypeConfig.display_name,
      max_position: unitTypeConfig.max_position,
      position_config: pos,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
      queryClient.invalidateQueries({ queryKey: ['master', 'unit-types'] });
      setEditMode(false);
    },
  });

  const handlePositionChange = (position, newCoords) => {
    if (!unitTypeConfig?.id) return;
    const updatedPositions = positions.map((p) =>
      p.position === position ? { ...p, x: newCoords.x, y: newCoords.y } : p
    );
    saveTemplateMutation.mutate({ id: unitTypeConfig.id, positions: updatedPositions });
  };

  const closeActionModal = () => {
    setSelectedPosition(null);
    setSelectedTyre(null);
    setAction('');
    setSpareTyreId('');
    setRtdInput('');
    setHmInput('');
    setRemarksInput('');
    setDriverId('');
    setCurrentLifeHm('');
    setHmPlan('');
    setDismountCondition('spare');
  };

  const handlePositionClick = (position, tyre) => {
    setSelectedPosition(position);
    setSelectedTyre(tyre);
  };

  const handleSelectSpare = (tyre) => {
    setSelectedTyre(tyre);
    setSpareTyreId(String(tyre.id));
    setAction('mount');
    setSelectedPosition(null);
  };

  const handleQueueAdd = () => {
    if (!action || !selectedPosition) return;
    if ((action === 'mount' || action === 'swap') && !spareTyreId) return;

    const spareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);
    setActionQueue((prev) => {
      const existing = prev.findIndex((q) => q.position === selectedPosition);
      const queueItem = {
        position: selectedPosition,
        action,
        old_tyre_id: selectedTyre ? selectedTyre.id : null,
        new_tyre_id: action !== 'dismount' ? Number(spareTyreId) : null,
        rtd: rtdInput ? Number(rtdInput) : null,
        condition: action === 'dismount' ? dismountCondition : null,
        tyre: selectedTyre,
        new_tyre: spareTyre,
        remarks: remarksInput || null,
        driver_id: driverId ? Number(driverId) : null,
        hm_plan: hmPlan ? Number(hmPlan) : null,
        current_life_hm: currentLifeHm ? Number(currentLifeHm) : null,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = queueItem;
        return updated;
      }
      return [...prev, queueItem];
    });
    closeActionModal();
  };

  const handleRemoveQueue = (idx) => {
    setActionQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBatchSubmit = () => {
    const details = actionQueue.map((q) => ({
      position: q.position,
      action: q.action,
      old_tyre_id: q.old_tyre_id || null,
      new_tyre_id: q.new_tyre_id || null,
      old_tyre_tread_1: q.rtd || null,
      old_tyre_tread_2: q.rtd || null,
      new_tyre_status: q.condition || '',
      remark: q.remarks || '',
    }));
    batchSubmitMutation.mutate({
      details,
      driver_id: actionQueue[0]?.driver_id || null,
      hm_plan: actionQueue[0]?.hm_plan || null,
      current_life_hm: actionQueue[0]?.current_life_hm || (unit?.current_hm || 0),
    });
  };

  const handleDirectSubmit = () => {
    if (!action || !selectedPosition) return;
    if ((action === 'mount' || action === 'swap') && !spareTyreId) return;
    submitMutation.mutate();
  };

  const selectedSpareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);

  // ─── DnD Handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event) => {
    setActiveDragItem(event.active.data.current || null);
    if (event.active.data.current?.type === 'SPARE_TYRE') {
      setIsDraggingSpare(true);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    setIsSparePanelDragOver(over?.id === 'spare-panel');
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveDragItem(null);
    setIsSparePanelDragOver(false);
    setIsDraggingSpare(false);
    const { active, over } = event;
    const sourceData = active.data.current;
    if (!sourceData) return;

    // Dropped on spare panel → dismount
    if (sourceData.type === 'MOUNTED_TYRE' && over?.id === 'spare-panel') {
      setSelectedPosition(sourceData.position);
      setSelectedTyre(sourceData.tyre);
      setAction('dismount');
      setDismountCondition('spare');
      setRtdInput('');
      setHmInput('');
      setCurrentLifeHm('');
      setHmPlan('');
      setRemarksInput('');
      return;
    }

    // Spare tyre dropped on canvas or slot
    if (sourceData.type === 'SPARE_TYRE' && (over?.id === 'canvas-droppable' || over?.id?.startsWith?.('position-'))) {
      const tyre = sourceData.tyre;
      // Prefer the slot's own data (set when dropping directly on a slot's droppable)
      const targetPosition = over?.data?.current?.position;
      const targetTyre = over?.data?.current?.tyre;
      const targetPos = targetPosition
        ? positions.find(p => p.position === targetPosition)
        : (() => {
            const ib = canvasOverlayRef.current?.imageBounds || {};
            const rect = canvasOverlayRef.current?.overlayRect;
            if (!rect) return null;
            const nx = (event.activatorEvent.clientX - rect.left - (ib.left || 0)) / (ib.width || rect.width);
            const ny = (event.activatorEvent.clientY - rect.top - (ib.top || 0)) / (ib.height || rect.height);
            return findPositionAtCoords(positions, nx, ny);
          })();
      if (!targetPos) return;

      if (targetTyre || targetPos.tyre) {
        setSelectedPosition(targetPos.position);
        setSelectedTyre(targetTyre || targetPos.tyre);
        setSpareTyreId(String(tyre.id));
        setAction('swap');
      } else {
        setSelectedPosition(targetPos.position);
        setSpareTyreId(String(tyre.id));
        setAction('mount');
      }
      setRtdInput('');
      setHmInput('');
      setCurrentLifeHm('');
      setHmPlan('');
      setRemarksInput('');
      return;
    }

    // Mounted tyre dropped on canvas or slot
    if (sourceData.type === 'MOUNTED_TYRE' && (over?.id === 'canvas-droppable' || over?.id?.startsWith?.('position-'))) {
      const targetPosition = over?.data?.current?.position;
      const tgtTyre = over?.data?.current?.tyre;
      const targetPos = targetPosition
        ? positions.find(p => p.position === targetPosition)
        : (() => {
            const ib = canvasOverlayRef.current?.imageBounds || {};
            const rect = canvasOverlayRef.current?.overlayRect;
            if (!rect) return null;
            const nx = (event.activatorEvent.clientX - rect.left - (ib.left || 0)) / (ib.width || rect.width);
            const ny = (event.activatorEvent.clientY - rect.top - (ib.top || 0)) / (ib.height || rect.height);
            return findPositionAtCoords(positions, nx, ny);
          })();
      if (!targetPos) return;
      if (targetPos.position === sourceData.position) return;

      setSelectedPosition(sourceData.position);
      setSelectedTyre(sourceData.tyre);
      if (tgtTyre || targetPos.tyre) {
        setAction('swap');
        setSpareTyreId(String((tgtTyre || targetPos.tyre).id));
      } else {
        setAction('mount');
        setSpareTyreId('');
      }
      setRtdInput('');
      setHmInput('');
      setCurrentLifeHm('');
      setHmPlan('');
      setRemarksInput('');
      return;
    }
  }, [positions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-80" />
        </div>
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/units/${id}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Unit Tyres</h1>
        </div>
        <EmptyState
          icon={CircleDot}
          title="Gagal memuat ban unit"
          message="Silakan coba lagi atau kembali ke halaman unit."
          action={
            <Button variant="outline" onClick={() => navigate(`/units/${id}`)}>
              Kembali ke Unit
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/units/${id}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Ban</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {unit.unit_id || `Unit #${id}`}
                </span>
                {unitTypeConfig && (
                  <span className="text-xs text-gray-400">{unitTypeConfig.display_name}</span>
                )}
                {unit.current_hm > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Gauge className="w-3 h-3" />
                    HM: {formatNumber(unit.current_hm, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/units/${id}`)}>
              Detail Unit
            </Button>
            <Button
              variant={editMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editMode ? 'Mode View' : 'Edit Layout'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CircleDot className="w-4.5 h-4.5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Mounted</p>
                <p className="text-lg font-bold text-gray-900">{totalMounted}</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Spare Tyres</p>
                <p className="text-lg font-bold text-gray-900">{totalSpare}</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Queue</p>
                <p className="text-lg font-bold text-gray-900">{actionQueue.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main: Canvas + Spare */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tyre Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Layout Posisi Ban</CardTitle>
                  {unitTypeConfig && (
                    <span className="text-xs text-gray-400">{unitTypeConfig.display_name}</span>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <TyrePositionCanvas
                  ref={canvasOverlayRef}
                  positions={positions}
                  unitTypeConfig={unitTypeConfig}
                  tyresData={positions}
                  onPositionClick={handlePositionClick}
                  onPositionChange={handlePositionChange}
                  mode={editMode ? 'edit' : 'view'}
                  height={520}
                  isDraggingSpare={isDraggingSpare}
                />
              </CardBody>
            </Card>
          </div>

          {/* Spare Tyres Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Spare Tyres ({totalSpare})</CardTitle>
              </CardHeader>
              <CardBody>
                <SparePanel
                  tyres={spareTyres}
                  search={searchSpare}
                  onSearch={setSearchSpare}
                  onSelect={handleSelectSpare}
                  selectedTyreId={selectedTyre?.id}
                  isDragOver={isSparePanelDragOver}
                />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Action Queue */}
        {actionQueue.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Action Queue ({actionQueue.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActionQueue([])}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={handleBatchSubmit} loading={batchSubmitMutation.isPending}>
                    Submit All ({actionQueue.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200">
                      <th className="text-left pb-2 font-medium">#</th>
                      <th className="text-left pb-2 font-medium">Pos</th>
                      <th className="text-left pb-2 font-medium">Action</th>
                      <th className="text-left pb-2 font-medium">Driver</th>
                      <th className="text-left pb-2 font-medium">HM Plan</th>
                      <th className="text-left pb-2 font-medium">Old Tyre</th>
                      <th className="text-left pb-2 font-medium">New Tyre</th>
                      <th className="text-left pb-2 font-medium">RTD</th>
                      <th className="text-right pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionQueue.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 text-gray-400">{idx + 1}</td>
                        <td className="py-2"><Badge size="sm">{item.position}</Badge></td>
                        <td className="py-2">
                          <Badge variant={item.action === 'mount' ? 'mounted' : item.action === 'dismount' ? 'dismounted' : 'pending'} size="sm">
                            {titleCase(item.action)}
                          </Badge>
                        </td>
                        <td className="py-2 text-gray-600">
                          {item.driver_id ? (drivers.find(d => d.id === item.driver_id)?.name || `#${item.driver_id}`) : '—'}
                        </td>
                        <td className="py-2 text-gray-600">
                          {item.hm_plan != null ? formatNumber(item.hm_plan, 0) : '—'}
                        </td>
                        <td className="py-2 text-gray-600">{item.tyre?.serial_number || '—'}</td>
                        <td className="py-2 text-gray-600">{item.new_tyre?.serial_number || '—'}</td>
                        <td className="py-2">{item.rtd !== null ? <RtdChip rtd={item.rtd} /> : '—'}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleRemoveQueue(idx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Position Action Modal */}
        <Modal
          isOpen={Boolean(selectedPosition)}
          onClose={closeActionModal}
          title={
            <div className="flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-primary-600" />
              <span>Position {selectedPosition}</span>
              {selectedTyre && <Badge size="sm" variant="mounted">Mounted</Badge>}
              {!selectedTyre && <Badge size="sm" variant="default">Empty</Badge>}
            </div>
          }
          size="md"
        >
          <div className="space-y-4">
            {selectedTyre ? (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Currently Mounted</p>
                <div className="flex flex-wrap items-center gap-2">
                  <TyreImg size={40} />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedTyre.serial_number || '—'}</div>
                    <div className="text-xs text-gray-500">{selectedTyre.brand?.name} {selectedTyre.size?.name}</div>
                  </div>
                  <RtdChip rtd={selectedTyre.rtd || selectedTyre.rtd_1} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 italic">Tidak ada ban terpasang di posisi ini.</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Action</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'mount', label: 'Mount', Icon: Plus },
                  { value: 'dismount', label: 'Dismount', Icon: CircleDot },
                  { value: 'swap', label: 'Swap', Icon: RefreshCw },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAction(value);
                      setSpareTyreId('');
                      setRtdInput('');
                      setDismountCondition('spare');
                    }}
                    disabled={value !== 'mount' && !selectedTyre}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                      action === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                    } ${value !== 'mount' && !selectedTyre ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic fields */}
            {action === 'mount' && (
              <div className="space-y-3">
                <FormField label="Select Spare Tyre" required>
                  <Select
                    options={spareTyres.map((t) => ({
                      value: String(t.id),
                      label: `${t.serial_number} — ${t.brand?.name || ''} — ${t.size?.name || ''} (RTD: ${t.rtd || t.rtd_1 || '—'}mm)`,
                    }))}
                    value={spareTyreId}
                    onChange={(e) => setSpareTyreId(e.target.value)}
                    placeholder="Pilih ban spare..."
                  />
                </FormField>
                {selectedSpareTyre && (
                  <div className="bg-green-50 rounded-lg p-2.5 border border-green-200 flex items-center gap-2">
                    <TyreImg size={32} />
                    <div>
                      <div className="text-xs font-semibold">{selectedSpareTyre.serial_number}</div>
                      <div className="text-[10px] text-gray-500">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input label="RTD (mm)" type="number" step="0.1" min="0" value={rtdInput} onChange={(e) => setRtdInput(e.target.value)} placeholder={selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 ? String(selectedSpareTyre.rtd || selectedSpareTyre.rtd_1) : ''} />
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={(e) => setCurrentLifeHm(e.target.value)}
                      placeholder={unit?.current_hm ? String(unit.current_hm) : '0'}
                    />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={(e) => setHmPlan(e.target.value)}
                      placeholder="Target HM"
                    />
                  </FormField>
                </div>
                <FormField label="Driver">
                  <Select
                    options={[
                      { value: '', label: 'Pilih driver...' },
                      ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
                    ]}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  />
                </FormField>
                <Textarea label="Remarks" rows={2} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} placeholder="Catatan opsional..." />
              </div>
            )}

            {action === 'dismount' && (
              <div className="space-y-3">
                <FormField label="Kondisi Setelah Lepas">
                  <Select
                    options={[
                      { value: 'spare', label: 'Spare (bisa dipakai lagi)' },
                      { value: 'scrap', label: 'Scrap (dibuang)' },
                    ]}
                    value={dismountCondition}
                    onChange={(e) => setDismountCondition(e.target.value)}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="RTD Terukur (mm)" type="number" step="0.1" min="0" value={rtdInput} onChange={(e) => setRtdInput(e.target.value)} placeholder={selectedTyre?.rtd || selectedTyre?.rtd_1 ? String(selectedTyre.rtd || selectedTyre.rtd_1) : ''} />
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={(e) => setCurrentLifeHm(e.target.value)}
                      placeholder={unit?.current_hm ? String(unit.current_hm) : '0'}
                    />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={(e) => setHmPlan(e.target.value)}
                      placeholder="Target HM"
                    />
                  </FormField>
                </div>
                <FormField label="Driver">
                  <Select
                    options={[
                      { value: '', label: 'Pilih driver...' },
                      ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
                    ]}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  />
                </FormField>
                <Textarea label="Remarks" rows={2} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} placeholder="Catatan opsional..." />
              </div>
            )}

            {action === 'swap' && (
              <div className="space-y-3">
                <FormField label="Ban Spare Baru" required>
                  <Select
                    options={spareTyres.map((t) => ({
                      value: String(t.id),
                      label: `${t.serial_number} — ${t.brand?.name || ''} — ${t.size?.name || ''} (RTD: ${t.rtd || t.rtd_1 || '—'}mm)`,
                    }))}
                    value={spareTyreId}
                    onChange={(e) => setSpareTyreId(e.target.value)}
                    placeholder="Pilih ban spare..."
                  />
                </FormField>
                {selectedSpareTyre && (
                  <div className="bg-green-50 rounded-lg p-2.5 border border-green-200 flex items-center gap-2">
                    <TyreImg size={32} />
                    <div>
                      <div className="text-xs font-semibold">{selectedSpareTyre.serial_number}</div>
                      <div className="text-[10px] text-gray-500">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input label="RTD (mm)" type="number" step="0.1" min="0" value={rtdInput} onChange={(e) => setRtdInput(e.target.value)} />
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentLifeHm}
                      onChange={(e) => setCurrentLifeHm(e.target.value)}
                      placeholder={unit?.current_hm ? String(unit.current_hm) : '0'}
                    />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hmPlan}
                      onChange={(e) => setHmPlan(e.target.value)}
                      placeholder="Target HM"
                    />
                  </FormField>
                </div>
                <FormField label="Driver">
                  <Select
                    options={[
                      { value: '', label: 'Pilih driver...' },
                      ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
                    ]}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  />
                </FormField>
                <Textarea label="Remarks" rows={2} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} placeholder="Catatan opsional..." />
              </div>
            )}

            {action && (
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <Button variant="outline" className="flex-1" onClick={handleQueueAdd}>
                  + Tambah ke Queue
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={action === 'mount' && !spareTyreId || action === 'swap' && !spareTyreId}
                  onClick={handleDirectSubmit}
                  loading={submitMutation.isPending}
                >
                  Submit Sekarang
                </Button>
              </div>
            )}

            {submitMutation.isError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {submitMutation.error?.response?.data?.message || 'Gagal submit. Silakan coba lagi.'}
              </div>
            )}
            {batchSubmitMutation.isError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {batchSubmitMutation.error?.response?.data?.message || 'Gagal submit batch. Silakan coba lagi.'}
              </div>
            )}
          </div>
        </Modal>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragItem ? (
          activeDragItem.type === 'SPARE_TYRE' ? (
            <SpareTyreOverlay tyre={activeDragItem.tyre} />
          ) : activeDragItem.type === 'MOUNTED_TYRE' ? (
            <MountedTyreOverlay tyre={activeDragItem.tyre} label={activeDragItem.label} />
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
