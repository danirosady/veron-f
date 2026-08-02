import { useState, useMemo } from 'react';
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
} from 'lucide-react';
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
import { formatNumber, titleCase, getRtdColor } from '@/utils/format';

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const color = getRtdColor(rtd);
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

function SpareTyreCard({ tyre, onSelect, isSelected }) {
  const rtd = tyre.rtd || tyre.rtd_1 || tyre.rtd;
  const brand = tyre.brand?.name || tyre.brand_name;
  const size = tyre.size?.name || tyre.size_name;

  return (
    <button
      onClick={() => onSelect(tyre)}
      className={`w-full text-left p-2.5 rounded-lg border transition-all duration-150 ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
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
          <div className="flex items-center gap-1.5 mt-0.5">
            {brand && <span className="text-[10px] text-gray-500 truncate">{brand}</span>}
            {size && <span className="text-[10px] text-gray-400 truncate">{size}</span>}
          </div>
        </div>
        <RtdChip rtd={rtd} />
      </div>
    </button>
  );
}

export default function UnitTyresPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTyre, setSelectedTyre] = useState(null);
  const [actionQueue, setActionQueue] = useState([]);
  const [searchSpare, setSearchSpare] = useState('');

  // Action form state
  const [action, setAction] = useState('');
  const [spareTyreId, setSpareTyreId] = useState('');
  const [rtdInput, setRtdInput] = useState('');
  const [hmInput, setHmInput] = useState('');
  const [replacementDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarksInput, setRemarksInput] = useState('');
  const [driverId, setDriverId] = useState('');
  const [dismountCondition, setDismountCondition] = useState('spare');

  // Fetch unit tyres data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['unit-tyres', id],
    queryFn: () => unitsAPI.getTyres(id),
    enabled: Boolean(id),
  });

  const unitData = data?.data?.data;
  const unit = unitData?.unit;
  const positions = unitData?.positions || [];
  const spareTyres = unitData?.spare_tyres || [];
  const unitTypeConfig = unitData?.unit_type_config;
  const totalMounted = unitData?.total_mounted || 0;
  const totalSpare = unitData?.total_spare || 0;

  const filteredSpareTyres = useMemo(() => {
    if (!searchSpare.trim()) return spareTyres;
    const q = searchSpare.toLowerCase();
    return spareTyres.filter(
      (t) =>
        (t.serial_number || '').toLowerCase().includes(q) ||
        (t.barcode || '').toLowerCase().includes(q) ||
        (t.brand?.name || t.brand_name || '').toLowerCase().includes(q) ||
        (t.size?.name || t.size_name || '').toLowerCase().includes(q)
    );
  }, [spareTyres, searchSpare]);

  // Direct submit mutation
  const submitMutation = useMutation({
    mutationFn: (payload) => replacementsAPI.create({
      unit_id: Number(id),
      driver_id: driverId ? Number(driverId) : null,
      date: replacementDate,
      hm_update: hmInput ? Number(hmInput) : 0,
      current_life_hm: unit?.current_hm || 0,
      hm_plan: 0,
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
    mutationFn: (details) => replacementsAPI.create({
      unit_id: Number(id),
      driver_id: driverId ? Number(driverId) : null,
      date: replacementDate,
      hm_update: hmInput ? Number(hmInput) : 0,
      current_life_hm: unit?.current_hm || 0,
      hm_plan: 0,
      remarks: remarksInput || null,
      details,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-tyres', id] });
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
    setDismountCondition('spare');
  };

  const handlePositionClick = (position, tyre) => {
    setSelectedPosition(position);
    setSelectedTyre(tyre);
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
    batchSubmitMutation.mutate(details);
  };

  const handleDirectSubmit = () => {
    if (!action || !selectedPosition) return;
    if ((action === 'mount' || action === 'swap') && !spareTyreId) return;
    submitMutation.mutate();
  };

  const selectedSpareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);

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
              <div className="w-64 h-64 bg-gray-100 rounded-lg animate-pulse mx-auto" />
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="w-32 h-4 bg-gray-200 rounded mb-3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-16 bg-gray-100 rounded mb-2" />
              ))}
            </div>
          </div>
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
          title="Failed to load unit tyres"
          message="Please try again or go back to the unit page."
          action={
            <Button variant="outline" onClick={() => navigate(`/units/${id}`)}>
              Back to Unit
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/units/${id}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tyre Management</h1>
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
            Unit Detail
          </Button>
        </div>
      </div>

      {/* Stats row */}
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

      {/* Main content: Canvas + Spare tyres */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tyre Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tyre Position Layout</CardTitle>
                {unitTypeConfig && (
                  <span className="text-xs text-gray-400">{unitTypeConfig.display_name}</span>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <TyrePositionCanvas
                positions={positions}
                unitTypeConfig={unitTypeConfig}
                onPositionClick={handlePositionClick}
                height={360}
              />
            </CardBody>
          </Card>
        </div>

        {/* Spare Tyres Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spare Tyres ({totalSpare})</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search barcode, SN, brand..."
                  value={searchSpare}
                  onChange={(e) => setSearchSpare(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                {filteredSpareTyres.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    {searchSpare ? 'No tyres match your search.' : 'No spare tyres available.'}
                  </p>
                ) : (
                  filteredSpareTyres.map((tyre) => (
                    <SpareTyreCard
                      key={tyre.id}
                      tyre={tyre}
                      onSelect={(t) => {
                        setSelectedTyre(t);
                        setSpareTyreId(String(t.id));
                        setAction('mount');
                        setSelectedPosition(null);
                      }}
                      isSelected={false}
                    />
                  ))
                )}
              </div>
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
                      <td className="py-2">
                        <Badge size="sm">{item.position}</Badge>
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            item.action === 'mount' ? 'mounted' :
                            item.action === 'dismount' ? 'dismounted' : 'pending'
                          }
                          size="sm"
                        >
                          {titleCase(item.action)}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-600">{item.tyre?.serial_number || '—'}</td>
                      <td className="py-2 text-gray-600">{item.new_tyre?.serial_number || '—'}</td>
                      <td className="py-2">{item.rtd !== null ? <RtdChip rtd={item.rtd} /> : '—'}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemoveQueue(idx)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
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
          {/* Current tyre info */}
          {selectedTyre ? (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Currently Mounted</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {selectedTyre.serial_number || '—'}
                </span>
                {selectedTyre.brand?.name && (
                  <span className="text-xs text-gray-500">{selectedTyre.brand.name}</span>
                )}
                {selectedTyre.size?.name && (
                  <span className="text-xs text-gray-400">{selectedTyre.size.name}</span>
                )}
                <RtdChip rtd={selectedTyre.rtd || selectedTyre.rtd_1} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 italic">No tyre mounted at this position.</p>
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
                  placeholder="Choose a spare tyre..."
                />
              </FormField>
              {selectedSpareTyre && (
                <div className="bg-green-50 rounded-lg p-2.5 border border-green-200 text-xs">
                  <span className="font-semibold">{selectedSpareTyre.serial_number}</span>
                  <span className="text-gray-500 ml-1">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="RTD (mm)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={rtdInput}
                  onChange={(e) => setRtdInput(e.target.value)}
                  placeholder={selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 ? String(selectedSpareTyre.rtd || selectedSpareTyre.rtd_1) : ''}
                />
                <Input
                  label="HM Reading"
                  type="number"
                  step="0.1"
                  min="0"
                  value={hmInput}
                  onChange={(e) => setHmInput(e.target.value)}
                  placeholder={unit?.current_hm ? String(unit.current_hm) : ''}
                />
              </div>
              <Textarea
                label="Remarks"
                rows={2}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          )}

          {action === 'dismount' && (
            <div className="space-y-3">
              <FormField label="Condition After Dismount">
                <Select
                  options={[
                    { value: 'spare', label: 'Spare (can be reused)' },
                    { value: 'scrap', label: 'Scrap (disposed)' },
                  ]}
                  value={dismountCondition}
                  onChange={(e) => setDismountCondition(e.target.value)}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Measured RTD (mm)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={rtdInput}
                  onChange={(e) => setRtdInput(e.target.value)}
                  placeholder={selectedTyre?.rtd || selectedTyre?.rtd_1 ? String(selectedTyre.rtd || selectedTyre.rtd_1) : ''}
                />
                <Input
                  label="HM Reading"
                  type="number"
                  step="0.1"
                  min="0"
                  value={hmInput}
                  onChange={(e) => setHmInput(e.target.value)}
                  placeholder={unit?.current_hm ? String(unit.current_hm) : ''}
                />
              </div>
              <Textarea
                label="Remarks"
                rows={2}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          )}

          {action === 'swap' && (
            <div className="space-y-3">
              <FormField label="New Spare Tyre" required>
                <Select
                  options={spareTyres.map((t) => ({
                    value: String(t.id),
                    label: `${t.serial_number} — ${t.brand?.name || ''} — ${t.size?.name || ''} (RTD: ${t.rtd || t.rtd_1 || '—'}mm)`,
                  }))}
                  value={spareTyreId}
                  onChange={(e) => setSpareTyreId(e.target.value)}
                  placeholder="Choose a spare tyre..."
                />
              </FormField>
              {selectedSpareTyre && (
                <div className="bg-green-50 rounded-lg p-2.5 border border-green-200 text-xs">
                  <span className="font-semibold">{selectedSpareTyre.serial_number}</span>
                  <span className="text-gray-500 ml-1">{selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="RTD (mm)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={rtdInput}
                  onChange={(e) => setRtdInput(e.target.value)}
                  placeholder={selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1 ? String(selectedSpareTyre.rtd || selectedSpareTyre.rtd_1) : ''}
                />
                <Input
                  label="HM Reading"
                  type="number"
                  step="0.1"
                  min="0"
                  value={hmInput}
                  onChange={(e) => setHmInput(e.target.value)}
                  placeholder={unit?.current_hm ? String(unit.current_hm) : ''}
                />
              </div>
              <Textarea
                label="Remarks"
                rows={2}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          )}

          {/* Submit buttons */}
          {action && (
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleQueueAdd}
              >
                + Add to Queue
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={
                  action === 'mount' && !spareTyreId ||
                  action === 'swap' && !spareTyreId
                }
                onClick={handleDirectSubmit}
                loading={submitMutation.isPending}
              >
                Submit Now
              </Button>
            </div>
          )}

          {submitMutation.isError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {submitMutation.error?.response?.data?.message || 'Failed to submit. Please try again.'}
            </div>
          )}
          {batchSubmitMutation.isError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {batchSubmitMutation.error?.response?.data?.message || 'Failed to submit batch. Please try again.'}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
