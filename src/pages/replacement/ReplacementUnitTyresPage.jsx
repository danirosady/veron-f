import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  Gauge,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvas from '@/components/tyre/TyrePositionCanvas';
import { unitsAPI } from '@/api/units';
import { replacementsAPI } from '@/api/replacements';
import { driversAPI } from '@/api/drivers';
import { companiesAPI } from '@/api/companies';
import { projectsAPI } from '@/api/projects';
import { formatNumber, getRtdColor } from '@/utils/format';
import { useTranslation } from 'react-i18next';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const color = getRtdColor(rtd);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${color === '#22c55e' ? 'bg-green-100 text-green-700 border-green-200' : color === '#eab308' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : color === '#f97316' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
      {formatNumber(rtd, 1)}mm
    </span>
  );
}

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

export default function ReplacementUnitTyresPage() {
  const { t } = useTranslation();
  const { companyId, projectId, unitId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasOverlayRef = useRef({});
  const { setBreadcrumb } = useBreadcrumb();

  const [actionQueue, setActionQueue] = useState([]);
  const [searchSpare, setSearchSpare] = useState('');
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [isDraggingSpare, setIsDraggingSpare] = useState(false);

  // Replacement date (shared across all actions)
  const [replacementDate] = useState(new Date().toISOString().split('T')[0]);
  // Driver selection for direct submit (outside balloon)
  const [driverId, setDriverId] = useState('');

  // ── Position action form — unified with TyrePositionCanvas balloon ──────────
  const [positionActionForm, setPositionActionForm] = useState({
    isOpen: false,
    position: null,
    tyre: null,
    step: 'choose',   // 'choose' | 'mount-form' | 'unmount-form' | 'swap-form'
    action: '',       // 'mount' | 'dismount' | 'swap'
    spareTyreId: '',
    rtdInput: '',
    hmInput: '',
    currentLifeHm: '',
    hmPlan: '',
    remarksInput: '',
    dismountCondition: 'spare',
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
      hmInput: '',
      currentLifeHm: '',
      hmPlan: '',
      remarksInput: '',
      dismountCondition: 'spare',
    }), []);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch: doRefetch } = useQuery({
    queryKey: ['unit-tyres', unitId],
    queryFn: () => unitsAPI.getTyres(unitId),
    enabled: Boolean(unitId),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { all: true }],
    queryFn: () => driversAPI.list({ per_page: 200 }),
  });

  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesAPI.get(companyId),
    enabled: Boolean(companyId),
  });

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: Boolean(projectId),
  });

  const unitData = data?.data?.data;
  const unit = unitData?.unit;
  const positions = unitData?.positions || [];
  const spareTyres = unitData?.spare_tyres || [];
  const unitTypeConfig = unitData?.unit_type_config;
  const totalMounted = unitData?.total_mounted || 0;
  const totalSpare = unitData?.total_spare || 0;
  const drivers = driversData?.data?.data || driversData?.data || [];

  useEffect(() => {
    if (companyData) {
      const company = companyData.data?.data || companyData.data;
      if (company?.name) {
        setBreadcrumb(company.name, `/replacement/companies/${companyId}`);
      }
    }
    if (projectData) {
      const project = projectData.data?.data || projectData.data;
      if (project?.name) {
        setBreadcrumb(project.name, `/replacement/companies/${companyId}/projects/${projectId}`);
      }
    }
    if (unit) {
      setBreadcrumb(unit.unit_id || unit.plate_number || `Unit #${unitId}`, `/replacement/companies/${companyId}/projects/${projectId}/units/${unitId}`);
    }
  }, [companyData, projectData, unit, companyId, projectId, unitId, setBreadcrumb]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: ({ action, position, tyre, spareTyreId, rtdInput,
                   currentLifeHm, hmPlan, remarksInput, dismountCondition }) =>
      replacementsAPI.create({
        unit_id: Number(unitId),
        driver_id: driverId ? Number(driverId) : null,
        date: replacementDate,
        hm_update: hmInput ? Number(hmInput) : 0,
        current_life_hm: currentLifeHm ? Number(currentLifeHm) : (unit?.current_hm || 0),
        hm_plan: hmPlan ? Number(hmPlan) : 0,
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
        }],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', unitId] });
      doRefetch();
      resetPositionActionForm();
    },
  });

  const batchSubmitMutation = useMutation({
    mutationFn: ({ details, driver_id, hm_plan, current_life_hm }) =>
      replacementsAPI.create({
        unit_id: Number(unitId),
        driver_id,
        date: replacementDate,
        hm_update: 0,
        current_life_hm,
        hm_plan,
        remarks: null,
        details,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', unitId] });
      doRefetch();
      setActionQueue([]);
      resetPositionActionForm();
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePositionClick = useCallback((position, tyre) => {
    updatePositionActionForm({
      isOpen: true,
      position,
      tyre: tyre || null,
      step: tyre ? 'choose' : 'mount-form',
      action: tyre ? 'swap' : 'mount',
      spareTyreId: '',
      rtdInput: '',
      hmInput: '',
      currentLifeHm: '',
      hmPlan: '',
      remarksInput: '',
      dismountCondition: 'spare',
    });
  }, [updatePositionActionForm]);

  const handleQueueAdd = useCallback(() => {
    const { position, tyre, action, spareTyreId, rtdInput,
            currentLifeHm, hmPlan, remarksInput, dismountCondition } = positionActionForm;

    if (!action || !position) return;
    if (action === 'mount' && !spareTyreId) return;
    if (action === 'swap' && (!spareTyreId || !tyre)) return;

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
    resetPositionActionForm();
  }, [positionActionForm, spareTyres, driverId, resetPositionActionForm]);

  const handleRemoveQueue = useCallback((idx) => {
    setActionQueue((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleBatchSubmit = useCallback((selectedDriverId) => {
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
      driver_id: selectedDriverId || actionQueue[0]?.driver_id || null,
      hm_plan: actionQueue[0]?.hm_plan || null,
      current_life_hm: actionQueue[0]?.current_life_hm || (unit?.current_hm || 0),
    });
  }, [actionQueue, unit, batchSubmitMutation]);

  const handleDirectSubmit = useCallback(() => {
    const { action, position, tyre, spareTyreId, rtdInput,
            currentLifeHm, hmPlan, remarksInput, dismountCondition } = positionActionForm;
    if (!action || !position) return;
    if (action === 'mount' && !spareTyreId) return;
    if (action === 'mount' && tyre) return;
    if (action === 'swap' && !spareTyreId) return;
    submitMutation.mutate({
      action, position, tyre, spareTyreId, rtdInput,
      currentLifeHm, hmPlan, remarksInput, dismountCondition,
    });
  }, [positionActionForm, submitMutation]);

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
      updatePositionActionForm({
        isOpen: true,
        position: sourceData.position,
        tyre: sourceData.tyre,
        step: 'unmount-form',
        action: 'dismount',
        spareTyreId: '',
        rtdInput: '',
        hmInput: '',
        currentLifeHm: '',
        hmPlan: '',
        remarksInput: '',
        dismountCondition: 'spare',
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

      if (targetTyre || targetPos.tyre) {
        updatePositionActionForm({
          isOpen: true,
          position: targetPos.position,
          tyre: targetTyre || targetPos.tyre,
          step: 'swap-form',
          action: 'swap',
          spareTyreId: String(tyre.id),
          rtdInput: '',
          hmInput: '',
          currentLifeHm: '',
          hmPlan: '',
          remarksInput: '',
          dismountCondition: 'spare',
        });
      } else {
        updatePositionActionForm({
          isOpen: true,
          position: targetPos.position,
          tyre: null,
          step: 'mount-form',
          action: 'mount',
          spareTyreId: String(tyre.id),
          rtdInput: '',
          hmInput: '',
          currentLifeHm: '',
          hmPlan: '',
          remarksInput: '',
          dismountCondition: 'spare',
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

      if (tgtTyre || targetPos.tyre) {
        updatePositionActionForm({
          isOpen: true,
          position: sourceData.position,
          tyre: sourceData.tyre,
          step: 'swap-form',
          action: 'swap',
          spareTyreId: String((tgtTyre || targetPos.tyre).id),
          rtdInput: '',
          hmInput: '',
          currentLifeHm: '',
          hmPlan: '',
          remarksInput: '',
          dismountCondition: 'spare',
        });
      } else {
        updatePositionActionForm({
          isOpen: true,
          position: sourceData.position,
          tyre: sourceData.tyre,
          step: 'unmount-form',
          action: 'dismount',
          spareTyreId: '',
          rtdInput: '',
          hmInput: '',
          currentLifeHm: '',
          hmPlan: '',
          remarksInput: '',
          dismountCondition: 'spare',
        });
      }
    }
  }, [positions, updatePositionActionForm]);

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
          <Button variant="ghost" onClick={() => navigate(`/replacement/companies/${companyId}/projects/${projectId}/units`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Ban</h1>
        </div>
        <EmptyState
          icon={TyreIcon}
          title="Gagal memuat ban unit"
          message="Silakan coba lagi atau kembali ke halaman unit."
          action={
            <Button variant="outline" onClick={() => navigate(`/replacement/companies/${companyId}/projects/${projectId}/units`)}>
              Kembali
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
            <Button variant="ghost" onClick={() => navigate(`/replacement/companies/${companyId}/projects/${projectId}/units`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link
                  to="/replacement"
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  {t('replacement.nav.home')}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{t('replacement.nav.units')}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{unit.unit_id || `Unit #${unitId}`}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <TyreIcon className="w-4 h-4 text-gray-500" />
                  {unit.unit_id || `Unit #${unitId}`}
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
            <Button variant="outline" size="sm" onClick={() => navigate(`/replacement/companies/${companyId}/projects/${projectId}/units`)}>
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
              mode="view"
              height={820}
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
                updatePositionActionForm(partial);
              }}
              unitCurrentHm={unit?.current_hm || 0}
              drivers={drivers}
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
