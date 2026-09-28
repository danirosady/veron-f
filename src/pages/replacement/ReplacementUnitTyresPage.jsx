import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  X,
  Gauge,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
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
import { driversAPI } from '@/api/drivers';
import { companiesAPI } from '@/api/companies';
import { projectsAPI } from '@/api/projects';
import { formatNumber, titleCase, getRtdColor } from '@/utils/format';
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
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTyre, setSelectedTyre] = useState(null);
  const [actionQueue, setActionQueue] = useState([]);
  const [searchSpare, setSearchSpare] = useState('');
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [isDraggingSpare, setIsDraggingSpare] = useState(false);

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

  const submitMutation = useMutation({
    mutationFn: (payload) => replacementsAPI.create({
      unit_id: Number(unitId),
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
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', unitId] });
      doRefetch();
      closeActionModal();
    },
  });

  const batchSubmitMutation = useMutation({
    mutationFn: ({ details, driver_id, hm_plan, current_life_hm }) => replacementsAPI.create({
      unit_id: Number(unitId),
      driver_id,
      date: replacementDate,
      hm_update: hmInput ? Number(hmInput) : 0,
      current_life_hm,
      hm_plan,
      remarks: remarksInput || null,
      details,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', unitId] });
      doRefetch();
      setActionQueue([]);
      closeActionModal();
    },
  });

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
    if (tyre) {
      setAction('swap');
    } else {
      setAction('');
    }
  };

  const handleSelectSpare = (tyre) => {
    setSelectedTyre(tyre);
    setSpareTyreId(String(tyre.id));
    setAction('mount');
    setSelectedPosition(null);
  };

  const handleQueueAdd = () => {
    if (!action || !selectedPosition) return;
    if (action === 'mount' && !spareTyreId) return;
    if (action === 'swap' && (!spareTyreId || !selectedTyre)) return;

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
    if (action === 'mount' && !spareTyreId) return;
    if (action === 'mount' && selectedTyre) return;
    if (action === 'swap' && !spareTyreId) return;
    submitMutation.mutate();
  };

  const selectedSpareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);

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
        {/* Header with replacement breadcrumbs */}
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

        {/* Canvas */}
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
              onSelectSpare={handleSelectSpare}
              selectedSpareTyreId={selectedTyre?.id}
              actionQueue={actionQueue}
              onRemoveQueue={handleRemoveQueue}
              onClearQueue={() => setActionQueue([])}
              onSubmitQueue={handleBatchSubmit}
              isSubmitting={batchSubmitMutation.isPending}
            />
          </CardBody>
        </Card>

        {/* Position Action Modal */}
        <Modal
          isOpen={Boolean(selectedPosition)}
          onClose={closeActionModal}
          title={
            <div className="flex items-center gap-2">
              <TyreIcon className="w-5 h-5 text-primary-600" />
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

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Action</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'mount', label: 'Mount', Icon: Plus },
                  { value: 'dismount', label: 'Dismount', Icon: TyreIcon },
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
                    disabled={(value === 'mount' && selectedTyre) || (value !== 'mount' && !selectedTyre)}
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
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input type="number" step="0.1" min="0" value={currentLifeHm} onChange={(e) => setCurrentLifeHm(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : '0'} />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input type="number" step="0.1" min="0" value={hmPlan} onChange={(e) => setHmPlan(e.target.value)} placeholder="Target HM" />
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
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input type="number" step="0.1" min="0" value={currentLifeHm} onChange={(e) => setCurrentLifeHm(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : '0'} />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input type="number" step="0.1" min="0" value={hmPlan} onChange={(e) => setHmPlan(e.target.value)} placeholder="Target HM" />
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
                  <Input label="HM Reading" type="number" step="0.1" min="0" value={hmInput} onChange={(e) => setHmInput(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Current Life HM">
                    <Input type="number" step="0.1" min="0" value={currentLifeHm} onChange={(e) => setCurrentLifeHm(e.target.value)} placeholder={unit?.current_hm ? String(unit?.current_hm) : '0'} />
                  </FormField>
                  <FormField label="HM Plan">
                    <Input type="number" step="0.1" min="0" value={hmPlan} onChange={(e) => setHmPlan(e.target.value)} placeholder="Target HM" />
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
                <Button variant="outline" className="flex-1" onClick={handleQueueAdd} disabled={(action === 'mount' && selectedTyre) || (action === 'mount' && !spareTyreId) || (action === 'swap' && (!spareTyreId || !selectedTyre))}>
                  + Tambah ke Queue
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={(action === 'mount' && !spareTyreId) || (action === 'mount' && selectedTyre) || (action === 'swap' && !spareTyreId)}
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

      <DragOverlay>
        {activeDragItem ? (
          activeDragItem.type === 'SPARE_TYRE' ? (
            <SpareTyreOverlay tyre={activeDragItem.tyre} />
          ) : activeDragItem.type === 'MOUNTED_TYRE' ? (
            <MountedTyreOverlay tyre={activeDragItem.tyre} />
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
