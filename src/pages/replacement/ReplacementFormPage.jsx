import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import { replacementsAPI } from '@/api/replacements';
import { unitsAPI } from '@/api/units';
import { tyresAPI } from '@/api/tyres';
import { driversAPI } from '@/api/drivers';
import { useAuth } from '@/hooks/useAuth';

export default function ReplacementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    unit_id: '',
    action: 'mount',
    position: '',
    old_tyre_id: '',
    new_tyre_id: '',
    driver_id: '',
    hm: '',
    replacement_date: new Date().toISOString().substring(0, 10),
    remarks: '',
  });
  const [errors, setErrors] = useState({});

  const { data: unitsData } = useQuery({
    queryKey: ['units', { all: true }],
    queryFn: () => unitsAPI.list({ per_page: 200 }),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { all: true }],
    queryFn: () => driversAPI.list({ per_page: 200 }),
  });

  const { data: mountedTyresData } = useQuery({
    queryKey: ['tyres', 'mounted', form.unit_id],
    queryFn: () => tyresAPI.list({ unit_id: form.unit_id, status: 'mounted', per_page: 200 }),
    enabled: Boolean(form.unit_id) && form.action !== 'mount',
  });

  const { data: spareTyresData } = useQuery({
    queryKey: ['tyres', 'spare'],
    queryFn: () => tyresAPI.list({ status: 'spare', per_page: 200 }),
    enabled: form.action !== 'dismount',
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? replacementsAPI.update(id, data) : replacementsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacements'] });
      navigate('/replacements');
    },
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.unit_id) newErrors.unit_id = 'Unit is required';
    if (!form.position) newErrors.position = 'Position is required';
    if (form.action === 'mount' && !form.new_tyre_id) newErrors.new_tyre_id = 'New tyre is required';
    if (form.action === 'dismount' && !form.old_tyre_id) newErrors.old_tyre_id = 'Tyre is required';
    if (form.action === 'swap' && (!form.old_tyre_id || !form.new_tyre_id)) {
      if (!form.old_tyre_id) newErrors.old_tyre_id = 'Old tyre is required';
      if (!form.new_tyre_id) newErrors.new_tyre_id = 'New tyre is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    saveMutation.mutate({
      ...form,
      unit_id: Number(form.unit_id),
      driver_id: form.driver_id ? Number(form.driver_id) : null,
      old_tyre_id: form.old_tyre_id ? Number(form.old_tyre_id) : null,
      new_tyre_id: form.new_tyre_id ? Number(form.new_tyre_id) : null,
      hm: form.hm ? Number(form.hm) : null,
      operator_id: user?.id,
    });
  };

  const units = unitsData?.data?.data || unitsData?.data || [];
  const drivers = driversData?.data?.data || driversData?.data || [];
  const mountedTyres = mountedTyresData?.data?.data || mountedTyresData?.data || [];
  const spareTyres = spareTyresData?.data?.data || spareTyresData?.data || [];

  const showOldTyre = form.action !== 'mount';
  const showNewTyre = form.action !== 'dismount';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/replacements')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit Replacement' : 'New Replacement'}
          subtitle={isEdit ? 'Update replacement record' : 'Mount, dismount, or swap a tyre'}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Action" required>
                <Select
                  options={[
                    { value: 'mount', label: 'Mount' },
                    { value: 'dismount', label: 'Dismount' },
                    { value: 'swap', label: 'Swap' },
                  ]}
                  value={form.action}
                  onChange={(e) => handleChange('action', e.target.value)}
                />
              </FormField>

              <FormField label="Unit" required error={errors.unit_id}>
                <Select
                  options={units.map((u) => ({
                    value: u.id,
                    label: u.plate_number || u.code || `Unit #${u.id}`,
                  }))}
                  placeholder="Select unit"
                  value={form.unit_id}
                  onChange={(e) => handleChange('unit_id', e.target.value)}
                />
              </FormField>

              <FormField label="Position" required error={errors.position}>
                <Input
                  placeholder="e.g. FL, FR, RL"
                  value={form.position}
                  onChange={(e) => handleChange('position', e.target.value.toUpperCase())}
                />
              </FormField>

              <FormField label="Date" required>
                <Input
                  type="date"
                  value={form.replacement_date}
                  onChange={(e) => handleChange('replacement_date', e.target.value)}
                />
              </FormField>

              {showOldTyre && (
                <FormField label="Old Tyre" required error={errors.old_tyre_id}>
                  <Select
                    options={mountedTyres.map((t) => ({
                      value: t.id,
                      label: t.serial_number,
                    }))}
                    placeholder={form.unit_id ? 'Select old tyre' : 'Select unit first'}
                    disabled={!form.unit_id}
                    value={form.old_tyre_id}
                    onChange={(e) => handleChange('old_tyre_id', e.target.value)}
                  />
                </FormField>
              )}

              {showNewTyre && (
                <FormField label="New Tyre" required error={errors.new_tyre_id}>
                  <Select
                    options={spareTyres.map((t) => ({
                      value: t.id,
                      label: t.serial_number,
                    }))}
                    placeholder="Select new tyre"
                    value={form.new_tyre_id}
                    onChange={(e) => handleChange('new_tyre_id', e.target.value)}
                  />
                </FormField>
              )}

              <FormField label="Driver">
                <Select
                  options={drivers.map((d) => ({ value: d.id, label: d.name }))}
                  placeholder="Select driver (optional)"
                  value={form.driver_id}
                  onChange={(e) => handleChange('driver_id', e.target.value)}
                />
              </FormField>

              <FormField label="HM (Hour Meter)">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Current HM"
                  value={form.hm}
                  onChange={(e) => handleChange('hm', e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Remarks">
              <Textarea
                rows={3}
                placeholder="Any additional notes..."
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
              />
            </FormField>

            {saveMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {saveMutation.error?.response?.data?.message || 'Failed to save replacement.'}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <Button variant="outline" type="button" onClick={() => navigate('/replacements')}>
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isLoading}>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Replacement' : 'Save Replacement'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}