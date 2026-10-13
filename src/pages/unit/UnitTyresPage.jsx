import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvas from '@/components/tyre/TyrePositionCanvas';
import { unitsAPI } from '@/api/units';
import { replacementsAPI } from '@/api/replacements';
import { masterAPI } from '@/api/master';
import { driversAPI } from '@/api/drivers';
import { formatNumber, getRtdColor } from '@/utils/format';

// ─── Drag Overlay Cards ────────────────────────────────────────────────────────

function SpareTyreOverlay({ tyre }) {
  const rtd = tyre?.rtd || tyre?.rtd_1;
  const rtdColor = rtd != null ? getRtdColor(rtd) : null;
  return (
    <img
      src="/tyre-pattern.png"
      alt="Tyre"
      className="object-contain select-none pointer-events-none"
      style={{
        width: 80,
        height: 92,
        opacity: 0.9,
        filter: rtdColor ? `drop-shadow(0 0 8px ${rtdColor})` : undefined,
      }}
      draggable={false}
    />
  );
}

function MountedTyreOverlay({ tyre }) {
  const rtd = tyre?.rtd || tyre?.rtd_1;
  const rtdColor = rtd != null ? getRtdColor(rtd) : null;
  return (
    <img
      src="/tyre-pattern.png"
      alt="Tyre"
      className="object-contain select-none pointer-events-none"
      style={{
        width: 80,
        height: 92,
        opacity: 0.9,
        filter: rtdColor ? `drop-shadow(0 0 8px ${rtdColor})` : undefined,
      }}
      draggable={false}
    />
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function findPositionAtCoords(positions, nx, ny) {
  let best = null;
  let bestDist = Infinity;
  for (const pos of positions) {
    if (pos.x == null || pos.y == null) continue;
    const d = Math.hypot(pos.x - nx, pos.y - ny);
    if (d < bestDist) { bestDist = d; best = pos; }
  }
  const threshold = 0.08;
  return bestDist < threshold ? best : null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function UnitTyresPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const goBack = () => navigate(-1);

  const [searchSpare, setSearchSpare] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [isDraggingSpare, setIsDraggingSpare] = useState(false);
  const canvasOverlayRef = useRef({});

  // Replacement date
  const [replacementDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Position action form — unified with TyrePositionCanvas balloon ──────────
  const [positionActionForm, setPositionActionForm] = useState({
    isOpen: false,
    position: null,
    tyre: null,
    step: 'choose',   // 'choose' | 'mount-form' | 'unmount-form' | 'swap-form'
    action: '',       // 'mount' | 'dismount' | 'swap'
    spareTyreId: '',
    rtdInput: '',
    currentLifeHm: '',
    remarksInput: '',
    dismountCondition: 'spare',
    reasonId: '',
    rtdError: '',
    currentLifeHmError: '',
  });

  const updatePositionActionForm = useCallback((partial) =>
    setPositionActionForm(prev => ({ ...prev, ...partial })), []);

  const resetPositionActionForm = useCallback(() =>
    setPositionActionForm({
      isOpen: false,
      position: null,
      tyre: null,
      step: 'choose',
      action: '',
      spareTyreId: '',
      rtdInput: '',
      currentLifeHm: '',
      remarksInput: '',
      dismountCondition: 'spare',
      reasonId: '',
      rtdError: '',
      currentLifeHmError: '',
    }), []);

  // Action queue
  const [actionQueue, setActionQueue] = useState([]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch: doRefetch } = useQuery({
    queryKey: ['unit-tyres', id],
    queryFn: () => unitsAPI.getTyres(id),
    enabled: Boolean(id),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { all: true }],
    queryFn: () => driversAPI.list({ per_page: 200 }),
  });

  const { data: reasonsData } = useQuery({
    queryKey: ['master-reasons'],
    queryFn: () => masterAPI.listReasons({ per_page: 100 }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const unitData = data?.data?.data;
  const unit = unitData?.unit;
  const positions = unitData?.positions || [];
  const spareTyres = unitData?.spare_tyres || [];
  const unitTypeConfig = unitData?.unit_type_config;
  const totalMounted = unitData?.total_mounted || 0;
  const totalSpare = unitData?.total_spare || 0;
  const drivers = (driversData?.data?.data || driversData?.data || [])
    .filter(d => d.company_id === unit?.company_id);

  const reasons = (reasonsData?.data?.data || reasonsData?.data || [])
    .filter(r => r.status === 'active' || !r.status);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: ({ action, position, tyre, spareTyreId, rtdInput,
                   currentLifeHm, remarksInput, dismountCondition, reasonId }) =>
      replacementsAPI.create({
        unit_id: Number(id),
        driver_id: null,
        date: replacementDate,
        hm_update: 0,
        current_life_hm: currentLifeHm ? Number(currentLifeHm) : (unit?.current_hm || 0),
        remarks: remarksInput || null,
        details: [{
          position,
          action,
          old_tyre_id: tyre?.id || null,
          new_tyre_id: action !== 'dismount' ? Number(spareTyreId) : null,
          old_tyre_tread_1: rtdInput ? Number(rtdInput) : null,
          old_tyre_tread_2: rtdInput ? Number(rtdInput) : null,
          new_tyre_status: action === 'dismount' ? dismountCondition : '',
          remark: remarksInput || '',
          failure_reason_id: reasonId ? Number(reasonId) : null,
          location: '',
        }],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
      resetPositionActionForm();
    },
  });

  const batchSubmitMutation = useMutation({
    mutationFn: ({ details, driver_id, hm_update, current_life_hm }) =>
      replacementsAPI.create({
        unit_id: Number(id),
        driver_id,
        date: replacementDate,
        hm_update,
        current_life_hm,
        remarks: null,
        details,
      }),
    onSuccess: (_, variables) => {
      if (variables.hm_update && variables.hm_update > 0) {
        unitsAPI.updateHM(id, { current_hm: variables.hm_update });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
      setActionQueue([]);
      resetPositionActionForm();
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: ({ id: tid, positions: pos }) => masterAPI.updateUnitType(tid, {
      unit_type: unitTypeConfig.unit_type,
      display_name: unitTypeConfig.display_name,
      max_position: unitTypeConfig.max_position,
      position_config: pos,
      status: unitTypeConfig.status || 'active',
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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePositionClick = useCallback((position, tyre) => {
    // Auto-populate Current Life HM from tyre's history (not unit's HM)
    const tyreCurrentLifeHm = tyre?.current_hm || tyre?.current_life_hm || tyre?.lifetime || '';
    updatePositionActionForm({
      isOpen: true,
      position,
      tyre: tyre || null,
      step: tyre ? 'choose' : 'mount-form',
      action: tyre ? 'swap' : 'mount',
      spareTyreId: '',
      rtdInput: '',
      currentLifeHm: String(tyreCurrentLifeHm),
      remarksInput: '',
      dismountCondition: 'spare',
      reasonId: '',
      rtdError: '',
    });
  }, [updatePositionActionForm]);

  const handleQueueAdd = useCallback(() => {
    const { position, tyre, action, spareTyreId, rtdInput,
            currentLifeHm, remarksInput, dismountCondition,
            reasonId, rtdError, currentLifeHmError } = positionActionForm;

    if (!action || !position) return;
    if (action === 'mount' && !spareTyreId) return;
    if (action === 'swap' && (!spareTyreId || !tyre)) return;
    // For dismount/swap: RTD must be filled
    if ((action === 'dismount' || action === 'swap') && !rtdInput) return;
    // Block if RTD validation failed
    if (rtdError) return;
    // Require reason for dismount and swap (not for mount - new tyre)
    if ((action === 'dismount' || action === 'swap') && !reasonId) return;

    const spareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);
    setActionQueue((prev) => {
      const existing = prev.findIndex((q) => q.position === position);
      const queueItem = {
        position,
        action,
        old_tyre_id: tyre ? tyre.id : null,
        new_tyre_id: action !== 'dismount' ? Number(spareTyreId) : null,
        rtd: rtdInput ? Number(rtdInput) : null,
        condition: action === 'dismount' ? dismountCondition : null,
        tyre,
        new_tyre: spareTyre,
        remarks: remarksInput || null,
        current_life_hm: currentLifeHm ? Number(currentLifeHm) : null,
        reason_id: reasonId || null,
        // HM Reading & Location to be filled in queue process
        hm_reading: null,
        location: '',
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = queueItem;
        return updated;
      }
      return [...prev, queueItem];
    });
    resetPositionActionForm();
  }, [positionActionForm, spareTyres, resetPositionActionForm]);

  const handleRemoveQueue = useCallback((idx) => {
    setActionQueue((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleBatchSubmit = useCallback((confirmData) => {
    const { driver_id, hm_reading, location } = confirmData || {};
    const details = actionQueue.map((q) => ({
      position: q.position,
      action: q.action,
      old_tyre_id: q.old_tyre_id || null,
      new_tyre_id: q.new_tyre_id || null,
      old_tyre_tread_1: q.rtd || null,
      old_tyre_tread_2: q.rtd || null,
      new_tyre_status: q.condition || '',
      remark: q.remarks || '',
      failure_reason_id: q.reason_id ? Number(q.reason_id) : null,
      location: location || '',
      hm_reading: hm_reading || null,
    }));
    batchSubmitMutation.mutate({
      details,
      driver_id: driver_id || null,
      hm_update: hm_reading || 0,
      current_life_hm: hm_reading || unit?.current_hm || 0,
    });
  }, [actionQueue, unit, batchSubmitMutation]);

  const handleDragStart = useCallback((event) => {
    setActiveDragItem(event.active.data.current || null);
    if (event.active.data.current?.type === 'SPARE_TYRE') {
      setIsDraggingSpare(true);
    }
  }, []);

  const handleDragOver = useCallback(() => {}, []);

  const handleDragEnd = useCallback((event) => {
    setActiveDragItem(null);
    setIsDraggingSpare(false);
    const { active, over } = event;
    const sourceData = active.data.current;
    if (!sourceData) return;

    // MOUNTED_TYRE → spare-panel → dismount
    if (sourceData.type === 'MOUNTED_TYRE' && over?.id === 'spare-panel') {
      const tyreHistoryHm = sourceData.tyre?.current_hm || sourceData.tyre?.current_life_hm || sourceData.tyre?.lifetime || '';
      updatePositionActionForm({
        isOpen: true,
        position: sourceData.position,
        tyre: sourceData.tyre,
        step: 'unmount-form',
        action: 'dismount',
        spareTyreId: '',
        rtdInput: '',
        currentLifeHm: String(tyreHistoryHm),
        remarksInput: '',
        dismountCondition: 'spare',
        reasonId: '',
        rtdError: '',
        currentLifeHmError: '',
      });
      return;
    }

    // SPARE_TYRE → canvas/slot
    if (sourceData.type === 'SPARE_TYRE' && (over?.id === 'canvas-droppable' || over?.id?.startsWith?.('position-'))) {
      const tyre = sourceData.tyre;
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

      // Get Current Life HM from spare tyre's history
      const spareTyreHistoryHm = tyre?.current_hm || tyre?.current_life_hm || tyre?.lifetime || '';

      if (targetTyre || targetPos.tyre) {
        // Swap: use mounted tyre's history
        const mountedTyreForSwap = targetTyre || targetPos.tyre;
        const mountedTyreRtd = mountedTyreForSwap?.rtd || mountedTyreForSwap?.rtd_1 || '';
        updatePositionActionForm({
          isOpen: true,
          position: targetPos.position,
          tyre: mountedTyreForSwap,
          step: 'swap-form',
          action: 'swap',
          spareTyreId: String(tyre.id),
          rtdInput: String(mountedTyreRtd),
          currentLifeHm: String(unit?.current_hm || mountedTyreHistoryHm),
          remarksInput: '',
          dismountCondition: 'spare',
          reasonId: '',
          rtdError: '',
          currentLifeHmError: '',
        });
      } else {
        // Mount: use spare tyre's history for Current Life HM
        updatePositionActionForm({
          isOpen: true,
          position: targetPos.position,
          tyre: null,
          step: 'mount-form',
          action: 'mount',
          spareTyreId: String(tyre.id),
          rtdInput: '',
          currentLifeHm: String(spareTyreHistoryHm),
          remarksInput: '',
          dismountCondition: 'spare',
          reasonId: '',
          rtdError: '',
          currentLifeHmError: '',
        });
      }
      return;
    }

    // MOUNTED_TYRE → canvas/slot (swap or dismount)
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

      // Get Current Life HM from mounted tyre's history
      const mountedTyreHistoryHm = sourceData.tyre?.current_hm || sourceData.tyre?.current_life_hm || sourceData.tyre?.lifetime || '';

      if (tgtTyre || targetPos.tyre) {
        // Swap: use mounted tyre's history
        const mountedTyreForSwap = tgtTyre || targetPos.tyre;
        const mountedTyreRtd = mountedTyreForSwap?.rtd || mountedTyreForSwap?.rtd_1 || '';
        updatePositionActionForm({
          isOpen: true,
          position: sourceData.position,
          tyre: sourceData.tyre,
          step: 'swap-form',
          action: 'swap',
          spareTyreId: String(mountedTyreForSwap.id),
          rtdInput: String(mountedTyreRtd),
          currentLifeHm: String(unit?.current_hm || mountedTyreHistoryHm),
          remarksInput: '',
          dismountCondition: 'spare',
          reasonId: '',
          rtdError: '',
          currentLifeHmError: '',
        });
      } else {
        // Dismount: use mounted tyre's history
        updatePositionActionForm({
          isOpen: true,
          position: sourceData.position,
          tyre: sourceData.tyre,
          step: 'unmount-form',
          action: 'dismount',
          spareTyreId: '',
          rtdInput: '',
          currentLifeHm: String(unit?.current_hm || mountedTyreHistoryHm),
          remarksInput: '',
          dismountCondition: 'spare',
          reasonId: '',
          rtdError: '',
          currentLifeHmError: '',
        });
      }
    }
  }, [positions, updatePositionActionForm, unit]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Unit Tyres</h1>
        </div>
        <EmptyState
          icon={TyreIcon}
          title="Gagal memuat ban unit"
          message="Silakan coba lagi atau kembali ke halaman unit."
          action={
            <Button variant="outline" onClick={goBack}>
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
            <Button variant="ghost" onClick={goBack}>
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
            <Button variant="ghost" size="sm" onClick={() => doRefetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goBack}>
              Kembali
            </Button>
          </div>
        </div>

        {/* Canvas with balloon overlays */}
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
              height={720}
              isDraggingSpare={isDraggingSpare}
              unit={unit}
              totalMounted={totalMounted}
              totalSpare={totalSpare}
              actionQueueLength={actionQueue.length}
              spareTyres={spareTyres}
              searchSpare={searchSpare}
              onSearchSpare={setSearchSpare}
              actionQueue={actionQueue}
              onRemoveQueue={handleRemoveQueue}
              onClearQueue={() => setActionQueue([])}
              onSubmitQueue={handleBatchSubmit}
              isSubmitting={batchSubmitMutation.isPending}
              positionActionForm={positionActionForm}
              onPositionActionChange={(partial) => {
                if (partial._triggerAddToQueue) {
                  handleQueueAdd();
                  return;
                }
                if (partial.step === 'unmount-form') {
                  updatePositionActionForm({ ...partial, action: 'dismount', spareTyreId: '' });
                  return;
                }
                // Auto-populate rtdInput when switching to swap-form
                if (partial.step === 'swap-form') {
                  const tyre = partial.tyre || positionActionForm.tyre;
                  const autoRtd = tyre?.rtd || tyre?.rtd_1 || '';
                  updatePositionActionForm({ ...partial, rtdInput: String(autoRtd), action: 'swap' });
                  return;
                }

                // Validation: RTD must be lower than previous (for unmount only — swap pre-fills old tyre RTD)
                let rtdError = '';
                const rtdVal = partial.rtdInput !== undefined ? partial.rtdInput : positionActionForm.rtdInput;
                const currentTyre = partial.tyre || positionActionForm.tyre;
                if (rtdVal && currentTyre && positionActionForm.step === 'unmount-form') {
                  const newRtd = parseFloat(rtdVal);
                  const previousRtd = currentTyre.rtd || currentTyre.rtd_1 || 0;
                  if (!isNaN(newRtd) && previousRtd > 0 && newRtd >= previousRtd) {
                    rtdError = `RTD harus lebih rendah dari sebelumnya (${previousRtd.toFixed(1)}mm)`;
                  }
                }

                updatePositionActionForm({ ...partial, rtdError });
              }}
              unitCurrentHm={unit?.current_hm || 0}
              drivers={drivers}
              reasons={reasons}
            />
          </CardBody>
        </Card>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem ? (
            activeDragItem.type === 'SPARE_TYRE' ? (
              <SpareTyreOverlay tyre={activeDragItem.tyre} />
            ) : activeDragItem.type === 'MOUNTED_TYRE' ? (
              <MountedTyreOverlay tyre={activeDragItem.tyre} />
            ) : null
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
