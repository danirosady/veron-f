import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Plus, RefreshCw, Gauge, Pencil } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvas from '@/components/tyre/TyrePositionCanvas';
import PositionActionModal from '@/components/replacement/PositionActionModal';
import { replacementsAPI } from '@/api/replacements';
import { unitsAPI } from '@/api/units';
import { driversAPI } from '@/api/drivers';
import { formatNumber, titleCase } from '@/utils/format';

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const color =
    rtd >= 20 ? 'spare' : rtd >= 10 ? 'warning' : 'dismounted';
  const colors = {
    spare: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dismounted: 'bg-red-100 text-red-700 border-red-200',
    scrap: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[color] || colors.scrap}`}>
      {formatNumber(rtd, 1)}mm
    </span>
  );
}

function SpareTyreMiniCard({ tyre, onClick, isSelected }) {
  const rtd = tyre.rtd || tyre.rtd_1;
  const brand = tyre.brand?.name || tyre.brand_name;
  const size = tyre.size?.name || tyre.size_name;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg border transition-all text-xs ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {tyre.serial_number || '—'}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {brand} {size}
          </p>
        </div>
        <RtdChip rtd={rtd} />
      </div>
    </button>
  );
}

export default function ReplacementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [actionQueue, setActionQueue] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [hmUpdate, setHmUpdate] = useState('');
  const [currentLifeHm, setCurrentLifeHm] = useState('');
  const [hmPlan, setHmPlan] = useState('');
  const [replacementDate, setReplacementDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState(null);
  const [modalTyre, setModalTyre] = useState(null);
  const [editingQueueIdx, setEditingQueueIdx] = useState(null);
  const [selectedSpareForMount, setSelectedSpareForMount] = useState('');

  // Fetch unit tyres data when unit is selected
  const { data: unitTyresData, isLoading: tyresLoading } = useQuery({
    queryKey: ['unit-tyres', selectedUnitId],
    queryFn: () => unitsAPI.getTyres(selectedUnitId),
    enabled: Boolean(selectedUnitId),
  });

  const unitTyres = unitTyresData?.data?.data;
  const positions = unitTyres?.positions || [];
  const spareTyres = unitTyres?.spare_tyres || [];
  const unit = unitTyres?.unit;
  const unitTypeConfig = unitTyres?.unit_type_config;

  // Fetch last replacement for HM auto-fill
  const { data: lastReplacementData } = useQuery({
    queryKey: ['replacements', 'last', selectedUnitId],
    queryFn: () => replacementsAPI.getLastByUnit(selectedUnitId),
    enabled: Boolean(selectedUnitId) && !isEdit,
  });

  const lastReplacement = lastReplacementData?.data?.data;

  // Auto-fill HM from last replacement
  useEffect(() => {
    if (lastReplacement && !isEdit) {
      if (lastReplacement.hm_update && !hmUpdate) {
        setHmUpdate(String(lastReplacement.hm_update));
      }
      if (lastReplacement.hm_plan && !currentLifeHm) {
        setCurrentLifeHm(String(lastReplacement.hm_plan));
      }
    }
  }, [lastReplacement, isEdit, hmUpdate, currentLifeHm]);

  // Pre-fill HM from unit's current HM
  useEffect(() => {
    if (unit?.current_hm && !isEdit && !hmUpdate) {
      setHmUpdate(String(unit.current_hm));
      if (!currentLifeHm) {
        setCurrentLifeHm(String(unit.current_hm));
      }
    }
  }, [unit, isEdit, hmUpdate, currentLifeHm]);

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { all: true }],
    queryFn: () => driversAPI.list({ per_page: 200 }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units', { all: true }],
    queryFn: () => unitsAPI.list({ per_page: 200 }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? replacementsAPI.update(id, data) : replacementsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacements'] });
      if (selectedUnitId) {
        queryClient.invalidateQueries({ queryKey: ['unit-tyres', selectedUnitId] });
      }
      navigate('/replacements');
    },
  });

  const drivers = driversData?.data?.data || driversData?.data || [];
  const units = unitsData?.data?.data || unitsData?.data || [];

  const handleUnitChange = (unitId) => {
    setSelectedUnitId(unitId);
    setActionQueue([]);
    setHmUpdate('');
    setCurrentLifeHm('');
    setHmPlan('');
    setDriverId('');
    setRemarks('');
    setErrors({});
    setModalOpen(false);
    setModalPosition(null);
    setModalTyre(null);
    setEditingQueueIdx(null);
    setSelectedSpareForMount('');
  };

  const openModalForPosition = (position, tyre) => {
    setModalPosition(position);
    setModalTyre(tyre);
    setEditingQueueIdx(null);
    setSelectedSpareForMount('');
    setModalOpen(true);
  };

  const openModalForQueueEdit = (idx) => {
    const item = actionQueue[idx];
    setModalPosition(item.position);
    setModalTyre(item.tyre || null);
    setEditingQueueIdx(idx);
    if (item.action === 'mount' || item.action === 'swap') {
      setSelectedSpareForMount(item.new_tyre_id ? String(item.new_tyre_id) : '');
    }
    setModalOpen(true);
  };

  const handleQueueAdd = (queueItem) => {
    setActionQueue((prev) => {
      const existing = prev.findIndex((q) => q.position === queueItem.position);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = queueItem;
        return updated;
      }
      return [...prev, queueItem];
    });
  };

  const handleModalQueueAdd = (queueItem) => {
    if (editingQueueIdx !== null) {
      setActionQueue((prev) => {
        const updated = [...prev];
        updated[editingQueueIdx] = queueItem;
        return updated;
      });
    } else {
      handleQueueAdd(queueItem);
    }
  };

  const handleRemoveQueue = (idx) => {
    setActionQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedUnitId) {
      setErrors({ unit_id: 'Unit is required' });
      return;
    }
    if (actionQueue.length === 0) {
      setErrors({ queue: 'Add at least one action to the queue' });
      return;
    }

    const newErrors = {};
    if (!replacementDate) newErrors.date = 'Date is required';
    if (hmUpdate && parseFloat(hmUpdate) < 0) newErrors.hm_update = 'HM must be positive';
    if (hmPlan && parseFloat(hmPlan) <= 0) newErrors.hm_plan = 'HM Plan must be greater than 0';
    if (hmPlan && currentLifeHm && parseFloat(hmPlan) <= parseFloat(currentLifeHm)) {
      newErrors.hm_plan = 'HM Plan must be greater than Current Life HM';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const details = actionQueue.map((q) => ({
      position: q.position,
      action: q.action,
      old_tyre_id: q.old_tyre_id || null,
      new_tyre_id: q.new_tyre_id || null,
      old_tyre_tread_1: q.rtd ? q.rtd : null,
      old_tyre_tread_2: q.rtd ? q.rtd : null,
      new_tyre_status: q.condition || '',
      remark: q.remarks || '',
    }));

    saveMutation.mutate({
      unit_id: Number(selectedUnitId),
      driver_id: driverId ? Number(driverId) : null,
      date: replacementDate,
      hm_update: hmUpdate ? parseFloat(hmUpdate) : 0,
      current_life_hm: currentLifeHm ? parseFloat(currentLifeHm) : 0,
      hm_plan: hmPlan ? parseFloat(hmPlan) : 0,
      remarks: remarks || '',
      details,
    });
  };

  const canvasPositions = useMemo(() => {
    if (!positions.length) return [];
    return positions.map((pos) => ({
      position: pos.position,
      label: pos.label || pos.position,
      side: pos.side || '',
      axle: pos.axle || '',
      x: pos.x || 0,
      y: pos.y || 0,
      tyre: pos.tyre || null,
      rtd: pos.rtd || pos.tyre?.rtd || null,
      status: pos.status || (pos.tyre ? 'mounted' : 'empty'),
    }));
  }, [positions]);

  // Merge queued actions into canvas positions for visual feedback
  const canvasWithQueue = useMemo(() => {
    return canvasPositions.map((pos) => {
      const queued = actionQueue.find((q) => q.position === pos.position);
      if (queued) {
        return {
          ...pos,
          queuedAction: queued.action,
          queuedTyre: queued.new_tyre,
        };
      }
      return pos;
    });
  }, [canvasPositions, actionQueue]);

  if (isEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/replacements')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <PageHeader
            title="Edit Replacement"
            subtitle="Update replacement record"
          />
        </div>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Edit mode is available through the visual tyre position page.
              <Button
                variant="outline"
                size="sm"
                className="ml-3"
                onClick={() => navigate(`/replacements`)}
              >
                Back to List
              </Button>
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/replacements')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title="New Replacement"
          subtitle="Batch tyre replacement with visual position layout"
        />
      </div>

      <form onSubmit={handleSubmit}>
        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Unit selector + Canvas */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unit & Tyres</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <FormField label="Unit" required error={errors.unit_id}>
                    <Select
                      options={units.map((u) => ({
                        value: String(u.id),
                        label: `${u.unit_id || `Unit #${u.id}`}${
                          u.plate_number ? ` — ${u.plate_number}` : ''
                        }`,
                      }))}
                      placeholder="Select unit"
                      value={selectedUnitId}
                      onChange={(e) => handleUnitChange(e.target.value)}
                    />
                  </FormField>

                  {selectedUnitId && (
                    <div className="space-y-3">
                      {/* Unit info bar */}
                      {unit && (
                        <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                          <span className="font-medium text-gray-700">
                            {unit.unit_id || `Unit #${selectedUnitId}`}
                          </span>
                          {unitTypeConfig && (
                            <span className="text-gray-400">
                              {unitTypeConfig.display_name}
                            </span>
                          )}
                          {unit.current_hm > 0 && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Gauge className="w-3 h-3" />
                              HM: {formatNumber(unit.current_hm, 0)}
                            </span>
                          )}
                          <span className="text-gray-400">
                            Mounted: {unitTyres?.total_mounted || 0}
                          </span>
                        </div>
                      )}

                      {/* Tyre canvas */}
                      {tyresLoading ? (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 h-[520px] flex items-center justify-center">
                          <div className="animate-pulse text-sm text-gray-400">
                            Loading tyres...
                          </div>
                        </div>
                      ) : canvasPositions.length > 0 ? (
                        <>
                          <TyrePositionCanvas
                            positions={canvasWithQueue}
                            unitTypeConfig={unitTypeConfig}
                            onPositionClick={openModalForPosition}
                            height={520}
                            disabled={false}
                          />
                          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                              Click a position to add action
                            </span>
                            {actionQueue.length > 0 && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded">
                                {actionQueue.length} queued
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 h-[520px] flex items-center justify-center">
                          <EmptyState
                            icon={TyreIcon}
                            title="No tyres loaded"
                            message="Select a unit to see its tyre positions."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Spare Tyres */}
            {selectedUnitId && spareTyres.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Spare Tyres ({spareTyres.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                    {spareTyres.slice(0, 12).map((tyre) => (
                      <SpareTyreMiniCard
                        key={tyre.id}
                        tyre={tyre}
                        onClick={() => setSelectedSpareForMount(String(tyre.id))}
                        isSelected={selectedSpareForMount === String(tyre.id)}
                      />
                    ))}
                  </div>
                  {spareTyres.length > 12 && (
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      +{spareTyres.length - 12} more — use canvas to mount
                    </p>
                  )}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right: Action queue + Meta fields */}
          <div className="space-y-4">
            {/* Action Queue */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Action Queue ({actionQueue.length})</CardTitle>
                  {actionQueue.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActionQueue([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {!selectedUnitId ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Select a unit to start adding actions.
                  </p>
                ) : actionQueue.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 text-center py-4">
                      Click a position on the canvas to add an action.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-xs text-blue-700">
                      <p className="font-medium">Quick Tip</p>
                      <p className="text-blue-600 mt-1">
                        Click any tyre position on the canvas to open the action
                        dialog. You can mount, dismount, or swap tyres.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-200">
                            <th className="text-left pb-2 font-medium">#</th>
                            <th className="text-left pb-2 font-medium">Pos</th>
                            <th className="text-left pb-2 font-medium">Action</th>
                            <th className="text-left pb-2 font-medium">Tyre</th>
                            <th className="text-left pb-2 font-medium">RTD</th>
                            <th className="text-right pb-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionQueue.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 text-gray-400">{idx + 1}</td>
                              <td className="py-2">
                                <Badge size="sm">{item.position}</Badge>
                              </td>
                              <td className="py-2">
                                <Badge
                                  variant={
                                    item.action === 'mount'
                                      ? 'mounted'
                                      : item.action === 'dismount'
                                      ? 'dismounted'
                                      : 'pending'
                                  }
                                  size="sm"
                                >
                                  {titleCase(item.action)}
                                </Badge>
                              </td>
                              <td className="py-2 text-gray-600">
                                {item.action === 'dismount'
                                  ? item.tyre?.serial_number || '—'
                                  : item.new_tyre?.serial_number || '—'}
                              </td>
                              <td className="py-2">
                                {item.rtd ? <RtdChip rtd={item.rtd} /> : '—'}
                              </td>
                              <td className="py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openModalForQueueEdit(idx)}
                                    className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQueue(idx)}
                                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                    title="Remove"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {errors.queue && (
                  <p className="mt-2 text-xs text-red-600">{errors.queue}</p>
                )}
              </CardBody>
            </Card>

            {/* Quick Add Actions — Mount/Dismount/Swap buttons */}
            {selectedUnitId && canvasPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {/* Mount all empty positions */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        Mount to Empty Positions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {canvasPositions
                          .filter((p) => p.status === 'empty' || !p.tyre)
                          .slice(0, 8)
                          .map((pos) => (
                            <button
                              key={pos.position}
                              type="button"
                              onClick={() =>
                                openModalForPosition(pos.position, null)
                              }
                              disabled={spareTyres.length === 0}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-dashed border-green-200 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                            >
                              <Plus className="w-3 h-3 text-green-600" />
                              <span className="text-green-700 font-medium">
                                {pos.label || pos.position}
                              </span>
                            </button>
                          ))}
                        {canvasPositions.filter(
                          (p) => p.status === 'empty' || !p.tyre
                        ).length === 0 && (
                          <p className="text-xs text-gray-400 italic">
                            No empty positions
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dismount mounted positions */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        Dismount Mounted Positions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {canvasPositions
                          .filter((p) => p.tyre)
                          .slice(0, 8)
                          .map((pos) => (
                            <button
                              key={pos.position}
                              type="button"
                              onClick={() =>
                                openModalForPosition(
                                  pos.position,
                                  pos.tyre
                                )
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-dashed border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-xs"
                            >
                              <TyreIcon className="w-3 h-3 text-red-600" />
                              <span className="text-red-700 font-medium">
                                {pos.label || pos.position}
                              </span>
                            </button>
                          ))}
                        {canvasPositions.filter((p) => p.tyre).length === 0 && (
                          <p className="text-xs text-gray-400 italic">
                            No mounted tyres
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Swap positions — any tyre with any spare */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        Swap Tyres
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {canvasPositions
                          .filter((p) => p.tyre)
                          .slice(0, 8)
                          .map((pos) => (
                            <button
                              key={pos.position}
                              type="button"
                              onClick={() =>
                                openModalForPosition(
                                  pos.position,
                                  pos.tyre
                                )
                              }
                              disabled={spareTyres.length === 0}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-600" />
                              <span className="text-amber-700 font-medium">
                                {pos.label || pos.position}
                              </span>
                            </button>
                          ))}
                        {canvasPositions.filter((p) => p.tyre).length === 0 && (
                          <p className="text-xs text-gray-400 italic">
                            No tyres to swap
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Replacement Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Date" required error={errors.date}>
                      <Input
                        type="date"
                        value={replacementDate}
                        onChange={(e) => setReplacementDate(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Driver">
                      <Select
                        options={[
                          { value: '', label: 'No driver' },
                          ...drivers.map((d) => ({
                            value: String(d.id),
                            label: d.name,
                          })),
                        ]}
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                      />
                    </FormField>

                    <FormField label="HM Reading" error={errors.hm_update}>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={
                          unit?.current_hm ? String(unit.current_hm) : '0'
                        }
                        value={hmUpdate}
                        onChange={(e) => setHmUpdate(e.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="Current Life HM"
                      error={errors.current_life_hm}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="From last replacement"
                        value={currentLifeHm}
                        onChange={(e) => setCurrentLifeHm(e.target.value)}
                      />
                    </FormField>

                    <FormField label="HM Plan" error={errors.hm_plan}>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Target HM"
                        value={hmPlan}
                        onChange={(e) => setHmPlan(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Remarks">
                    <Textarea
                      rows={2}
                      placeholder="Optional notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </FormField>

                  {saveMutation.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {saveMutation.error?.response?.data?.message ||
                        'Failed to save replacement.'}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate('/replacements')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={saveMutation.isLoading}
                      disabled={actionQueue.length === 0}
                    >
                      <Save className="w-4 h-4" />
                      Submit ({actionQueue.length}) Actions
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>

      {/* Position Action Modal */}
      <PositionActionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalPosition(null);
          setModalTyre(null);
          setEditingQueueIdx(null);
          setSelectedSpareForMount('');
        }}
        position={modalPosition}
        tyre={modalTyre}
        spareTyres={spareTyres}
        unitCurrentHm={unit?.current_hm || 0}
        queueItem={
          editingQueueIdx !== null ? actionQueue[editingQueueIdx] : null
        }
        onQueueAdd={handleModalQueueAdd}
        onDirectSubmit={null}
        submitLoading={false}
        submitError={
          saveMutation.isError
            ? saveMutation.error?.response?.data?.message ||
              'Failed to save replacement.'
            : null
        }
      />
    </div>
  );
}
