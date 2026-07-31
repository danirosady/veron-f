import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Plus,
  ArrowUpFromLine,
  ArrowDownToLine,
  ArrowLeftRight,
  Truck,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import Badge from '@/components/ui/Badge';
import { replacementsAPI } from '@/api/replacements';
import { driversAPI } from '@/api/drivers';
import { formatNumber, getRtdColor } from '@/utils/format';

const ACTION_RTD_THRESHOLDS = {
  spare: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', label: 'Green' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', label: 'Amber' },
  dismounted: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', label: 'Red' },
  scrap: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', label: 'Gray' },
  default: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-400', label: 'Unknown' },
};

function getRtdBadgeColors(rtd) {
  return ACTION_RTD_THRESHOLDS[getRtdColor(rtd)] || ACTION_RTD_THRESHOLDS.default;
}

function RtdBadge({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const colors = getRtdBadgeColors(rtd);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.border} ${colors.text}`}
    >
      RTD: {formatNumber(rtd, 1)}mm
    </span>
  );
}

function TyreInfoCard({ tyre, label }) {
  if (!tyre) return null;
  const rtd = tyre.rtd ?? tyre.rtd_avg ?? null;
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1.5">
      {label && <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">
          {tyre.serial_number || '—'}
        </span>
        {tyre.brand_name && (
          <span className="text-xs text-gray-500">{tyre.brand_name}</span>
        )}
        {tyre.size_name && (
          <span className="text-xs text-gray-400">{tyre.size_name}</span>
        )}
        {tyre.pattern_name && (
          <span className="text-xs text-gray-400">{tyre.pattern_name}</span>
        )}
      </div>
      {rtd !== null && <RtdBadge rtd={rtd} />}
    </div>
  );
}

export default function PositionActionModal({
  isOpen,
  onClose,
  position,
  unitId,
  unitCode,
  currentTyre,
  spareTyres = [],
  onActionComplete,
}) {
  const [action, setAction] = useState('');
  const [selectedTyreId, setSelectedTyreId] = useState('');
  const [hm, setHm] = useState('');
  const [replacementDate, setReplacementDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [driverId, setDriverId] = useState('');
  const [dismountCondition, setDismountCondition] = useState('spare');
  const [dismountRtd, setDismountRtd] = useState('');

  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'select'],
    queryFn: () => driversAPI.list({ page: 1, per_page: 500, status: 'active' }),
    enabled: isOpen,
  });

  const drivers = driversData?.data?.data || [];
  const driverOptions = drivers.map((d) => ({
    value: String(d.id),
    label: d.name || d.code || String(d.id),
  }));

  const selectedSpareTyre = spareTyres.find(
    (t) => String(t.id) === selectedTyreId
  );

  const spareTyreOptions = spareTyres
    .filter((t) => t.status === 'spare')
    .map((t) => ({
      value: String(t.id),
      label: `${t.serial_number} — ${t.brand_name || '—'} — ${t.size_name || '—'} (RTD: ${
        t.rtd ?? t.rtd_avg ?? '—'
      }mm)`,
    }));

  const resetForm = () => {
    setAction('');
    setSelectedTyreId('');
    setHm('');
    setReplacementDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setDriverId('');
    setDismountCondition('spare');
    setDismountRtd('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (data) => replacementsAPI.create(data),
    onSuccess: () => {
      onActionComplete?.();
      handleClose();
    },
  });

  const buildPayload = () => {
    const base = {
      unit_id: unitId,
      position,
      replacement_date: replacementDate,
      hm: hm ? Number(hm) : null,
      driver_id: driverId ? Number(driverId) : null,
      remarks: remarks || null,
    };

    switch (action) {
      case 'mount':
        return {
          ...base,
          action_type: 'mount',
          tyre_id: Number(selectedTyreId),
          rtd: dismountRtd ? Number(dismountRtd) : selectedSpareTyre?.rtd ?? selectedSpareTyre?.rtd_avg ?? null,
        };
      case 'dismount':
        return {
          ...base,
          action_type: 'dismount',
          tyre_id: currentTyre?.id,
          rtd: dismountRtd ? Number(dismountRtd) : currentTyre?.rtd ?? currentTyre?.rtd_avg ?? null,
          condition: dismountCondition,
        };
      case 'swap':
        return {
          ...base,
          action_type: 'swap',
          old_tyre_id: currentTyre?.id,
          new_tyre_id: Number(selectedTyreId),
          rtd: dismountRtd ? Number(dismountRtd) : selectedSpareTyre?.rtd ?? selectedSpareTyre?.rtd_avg ?? null,
        };
      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending;
  const canSubmit =
    action &&
    (action === 'dismount' ||
      (selectedTyreId && (action === 'mount' || action === 'swap')));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary-600" />
          <span>Position: {position}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Unit info */}
        <div className="text-sm text-gray-500">
          Unit: <span className="font-medium text-gray-700">{unitCode || unitId}</span>
        </div>

        {/* Current tyre info */}
        {currentTyre ? (
          <TyreInfoCard tyre={currentTyre} label="Currently Mounted Tyre" />
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 border-dashed">
            <p className="text-sm text-gray-400 italic">No tyre mounted at this position.</p>
          </div>
        )}

        {/* Action selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Action</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setAction('mount');
                setSelectedTyreId('');
                setDismountRtd('');
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${
                action === 'mount'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">Mount</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('dismount');
                setSelectedTyreId('');
              }}
              disabled={!currentTyre}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${
                action === 'dismount'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              } ${!currentTyre ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ArrowDownToLine className="w-5 h-5" />
              <span className="text-xs font-semibold">Dismount</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('swap');
                setSelectedTyreId('');
                setDismountRtd('');
              }}
              disabled={!currentTyre}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${
                action === 'swap'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              } ${!currentTyre ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ArrowLeftRight className="w-5 h-5" />
              <span className="text-xs font-semibold">Swap</span>
            </button>
          </div>
        </div>

        {/* Dynamic form fields */}
        {action === 'mount' && (
          <div className="space-y-4">
            <FormField label="Select Tyre" required>
              <Select
                options={spareTyreOptions}
                value={selectedTyreId}
                onChange={(e) => setSelectedTyreId(e.target.value)}
                placeholder="Choose a spare tyre..."
              />
            </FormField>

            {selectedSpareTyre && (
              <TyreInfoCard tyre={selectedSpareTyre} label="Selected Tyre" />
            )}

            <FormField label="RTD (mm)" helper="Remaining tread depth in mm">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={dismountRtd}
                onChange={(e) => setDismountRtd(e.target.value)}
                placeholder={
                  selectedSpareTyre?.rtd ?? selectedSpareTyre?.rtd_avg
                    ? String(selectedSpareTyre.rtd ?? selectedSpareTyre.rtd_avg)
                    : ''
                }
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HM Reading"
                type="number"
                step="0.1"
                min="0"
                value={hm}
                onChange={(e) => setHm(e.target.value)}
                placeholder="e.g. 1234.5"
              />
              <Input
                label="Date"
                type="date"
                value={replacementDate}
                onChange={(e) => setReplacementDate(e.target.value)}
              />
            </div>

            <FormField label="Driver">
              <Select
                options={driverOptions}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Select driver (optional)"
              />
            </FormField>

            <Textarea
              label="Remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        )}

        {action === 'dismount' && (
          <div className="space-y-4">
            <FormField label="Measured RTD (mm)" helper="Record the remaining tread depth">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={dismountRtd}
                onChange={(e) => setDismountRtd(e.target.value)}
                placeholder={
                  currentTyre?.rtd ?? currentTyre?.rtd_avg
                    ? String(currentTyre.rtd ?? currentTyre.rtd_avg)
                    : ''
                }
              />
            </FormField>

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

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HM Reading"
                type="number"
                step="0.1"
                min="0"
                value={hm}
                onChange={(e) => setHm(e.target.value)}
                placeholder="e.g. 1234.5"
              />
              <Input
                label="Date"
                type="date"
                value={replacementDate}
                onChange={(e) => setReplacementDate(e.target.value)}
              />
            </div>

            <FormField label="Driver">
              <Select
                options={driverOptions}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Select driver (optional)"
              />
            </FormField>

            <Textarea
              label="Remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        )}

        {action === 'swap' && (
          <div className="space-y-4">
            <FormField label="New Tyre (Spare)" required>
              <Select
                options={spareTyreOptions}
                value={selectedTyreId}
                onChange={(e) => setSelectedTyreId(e.target.value)}
                placeholder="Choose a spare tyre..."
              />
            </FormField>

            {selectedSpareTyre && (
              <TyreInfoCard tyre={selectedSpareTyre} label="New Tyre" />
            )}

            <FormField label="RTD (mm)" helper="Remaining tread depth of new tyre">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={dismountRtd}
                onChange={(e) => setDismountRtd(e.target.value)}
                placeholder={
                  selectedSpareTyre?.rtd ?? selectedSpareTyre?.rtd_avg
                    ? String(selectedSpareTyre.rtd ?? selectedSpareTyre.rtd_avg)
                    : ''
                }
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HM Reading"
                type="number"
                step="0.1"
                min="0"
                value={hm}
                onChange={(e) => setHm(e.target.value)}
                placeholder="e.g. 1234.5"
              />
              <Input
                label="Date"
                type="date"
                value={replacementDate}
                onChange={(e) => setReplacementDate(e.target.value)}
              />
            </div>

            <FormField label="Driver">
              <Select
                options={driverOptions}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Select driver (optional)"
              />
            </FormField>

            <Textarea
              label="Remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!canSubmit}
          >
            {action === 'mount' && 'Mount Tyre'}
            {action === 'dismount' && 'Dismount Tyre'}
            {action === 'swap' && 'Swap Tyre'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
