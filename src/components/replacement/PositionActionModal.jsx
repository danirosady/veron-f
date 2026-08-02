import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import Badge from '@/components/ui/Badge';
import { Plus, Brackets, RefreshCw } from 'lucide-react';
import { titleCase } from '@/utils/format';

function RtdChip({ rtd }) {
  if (rtd === null || rtd === undefined) return null;
  const colors =
    rtd >= 20
      ? 'bg-green-100 text-green-700 border-green-200'
      : rtd >= 10
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors}`}>
      {rtd}mm
    </span>
  );
}

export default function PositionActionModal({
  isOpen,
  onClose,
  position,
  tyre,
  spareTyres,
  unitCurrentHm,
  queueItem,
  onQueueAdd,
  onDirectSubmit,
  submitLoading,
  submitError,
}) {
  const isEditMode = Boolean(queueItem);
  const [action, setAction] = useState(queueItem?.action || (tyre ? 'dismount' : 'mount'));
  const [spareTyreId, setSpareTyreId] = useState(
    queueItem?.new_tyre_id ? String(queueItem.new_tyre_id) : ''
  );
  const [rtdInput, setRtdInput] = useState(
    queueItem?.rtd != null ? String(queueItem.rtd) : ''
  );
  const [hmInput, setHmInput] = useState('');
  const [remarksInput, setRemarksInput] = useState(queueItem?.remarks || '');
  const [dismountCondition, setDismountCondition] = useState(
    queueItem?.condition || 'spare'
  );

  const selectedSpareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);

  const isMountAction = action === 'mount';
  const isSwapAction = action === 'swap';
  const isDismountAction = action === 'dismount';

  const canSubmit =
    (isMountAction || isSwapAction) && spareTyreId;

  const handleActionChange = (val) => {
    setAction(val);
    setSpareTyreId('');
    setRtdInput('');
    setDismountCondition('spare');
  };

  const handleQueueAdd = () => {
    const spareTyre = spareTyres.find((t) => String(t.id) === spareTyreId);
    onQueueAdd({
      position,
      action,
      old_tyre_id: tyre ? tyre.id : null,
      new_tyre_id: isDismountAction ? null : Number(spareTyreId),
      rtd: rtdInput ? Number(rtdInput) : null,
      condition: isDismountAction ? dismountCondition : null,
      remarks: remarksInput,
      tyre,
      new_tyre: spareTyre,
    });
    handleClose();
  };

  const handleDirectSubmit = () => {
    onDirectSubmit({
      position,
      action,
      old_tyre_id: tyre ? tyre.id : null,
      new_tyre_id: isDismountAction ? null : Number(spareTyreId),
      rtd: rtdInput ? Number(rtdInput) : null,
      condition: isDismountAction ? dismountCondition : null,
      remarks: remarksInput,
    });
    handleClose();
  };

  const handleClose = () => {
    setAction(tyre ? 'dismount' : 'mount');
    setSpareTyreId('');
    setRtdInput('');
    setHmInput('');
    setRemarksInput('');
    setDismountCondition('spare');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Brackets className="w-5 h-5 text-primary-600" />
          <span>Position {position}</span>
          {tyre && <Badge size="sm" variant="mounted">Mounted</Badge>}
          {!tyre && <Badge size="sm" variant="default">Empty</Badge>}
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Current tyre info */}
        {tyre ? (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              Currently Mounted
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                {tyre.serial_number || '—'}
              </span>
              {tyre.brand?.name && (
                <span className="text-xs text-gray-500">{tyre.brand.name}</span>
              )}
              {tyre.size?.name && (
                <span className="text-xs text-gray-400">{tyre.size.name}</span>
              )}
              <RtdChip rtd={tyre.rtd || tyre.rtd_1} />
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
              { value: 'dismount', label: 'Dismount', Icon: Brackets },
              { value: 'swap', label: 'Swap', Icon: RefreshCw },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleActionChange(value)}
                disabled={value !== 'mount' && !tyre}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                  action === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                } ${value !== 'mount' && !tyre ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mount / Swap fields */}
        {(isMountAction || isSwapAction) && (
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
                <span className="text-gray-500 ml-1">
                  {selectedSpareTyre.brand?.name} {selectedSpareTyre.size?.name}
                </span>
                <RtdChip rtd={selectedSpareTyre.rtd || selectedSpareTyre.rtd_1} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Measured RTD (mm)"
                type="number"
                step="0.1"
                min="0"
                value={rtdInput}
                onChange={(e) => setRtdInput(e.target.value)}
                placeholder={
                  selectedSpareTyre?.rtd || selectedSpareTyre?.rtd_1
                    ? String(selectedSpareTyre.rtd || selectedSpareTyre.rtd_1)
                    : ''
                }
              />
              <Input
                label="HM Reading"
                type="number"
                step="0.1"
                min="0"
                value={hmInput}
                onChange={(e) => setHmInput(e.target.value)}
                placeholder={unitCurrentHm ? String(unitCurrentHm) : ''}
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

        {/* Dismount fields */}
        {isDismountAction && (
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
                placeholder={
                  tyre?.rtd || tyre?.rtd_1 ? String(tyre.rtd || tyre.rtd_1) : ''
                }
              />
              <Input
                label="HM Reading"
                type="number"
                step="0.1"
                min="0"
                value={hmInput}
                onChange={(e) => setHmInput(e.target.value)}
                placeholder={unitCurrentHm ? String(unitCurrentHm) : ''}
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
            {onQueueAdd && (
              <Button variant="outline" className="flex-1" onClick={handleQueueAdd}>
                + {isEditMode ? 'Update in Queue' : 'Add to Queue'}
              </Button>
            )}
            {onDirectSubmit && (
              <Button
                variant="primary"
                className="flex-1"
                disabled={!canSubmit}
                onClick={handleDirectSubmit}
                loading={submitLoading}
              >
                Submit Now
              </Button>
            )}
          </div>
        )}

        {submitError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            {submitError}
          </div>
        )}
      </div>
    </Modal>
  );
}
