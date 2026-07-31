import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/form/FormField';
import { unitsAPI } from '@/api/units';
import { companiesAPI } from '@/api/companies';
import { projectsAPI } from '@/api/projects';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

const unitSchema = z.object({
  unit_id: z.string().min(1, 'Unit ID is required').max(50),
  company_id: z.string().min(1, 'Company is required'),
  project_id: z.string().min(1, 'Project is required'),
  unit_model: z.string().max(255).optional().or(z.literal('')),
  plate_number: z.string().max(50).optional().or(z.literal('')),
  tyre_size_default: z.string().min(1, 'Tyre Size Default is required').max(50),
  unit_type: z.string().min(1, 'Type is required'),
  max_position: z.string().min(1, 'Max Position is required'),
  current_hm: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

export default function UnitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);

  const { data: unitData, isLoading: loadingUnit } = useQuery({
    queryKey: ['unit', id],
    queryFn: () => unitsAPI.get(id),
    enabled: isEdit,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
  });

  const initialCompanyId = isSuperadmin() ? '' : (user?.company_id || '');
  const [companyId, setCompanyId] = React.useState(initialCompanyId);

  const { data: projectsData } = useQuery({
    queryKey: ['projects', { all: true, company_id: companyId }],
    queryFn: () =>
      projectsAPI.list({
        per_page: 200,
        ...(companyId ? { company_id: companyId } : {}),
      }),
  });

  const { data: unitTypesData } = useQuery({
    queryKey: ['master', 'unit-types'],
    queryFn: () => masterAPI.listUnitTypes({ per_page: 200 }),
  });

  const { data: sizesData } = useQuery({
    queryKey: ['master', 'sizes', { all: true }],
    queryFn: () => masterAPI.listSizes({ per_page: 200 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unit_id: '',
      company_id: initialCompanyId ? String(initialCompanyId) : '',
      project_id: '',
      unit_model: '',
      plate_number: '',
      tyre_size_default: '',
      unit_type: '',
      max_position: '',
      current_hm: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (unitData && isEdit) {
      const u = unitData.data?.data || unitData.data;
      const cid = u.company_id ? String(u.company_id) : '';
      setCompanyId(cid);
      reset({
        unit_id: u.unit_id || '',
        company_id: cid,
        project_id: u.project_id ? String(u.project_id) : '',
        unit_model: u.unit_model || '',
        plate_number: u.plate_number || '',
        tyre_size_default: u.tyre_size_default || '',
        unit_type: u.unit_type || '',
        max_position: u.max_position ? String(u.max_position) : '',
        current_hm: u.current_hm ? String(u.current_hm) : '',
        status: u.status || 'active',
      });
    }
  }, [unitData, isEdit, reset]);

  const watchedCompanyId = watch('company_id');
  useEffect(() => {
    setCompanyId(watchedCompanyId);
    if (!isEdit) {
      setValue('project_id', '');
    }
  }, [watchedCompanyId, setValue, isEdit]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? unitsAPI.update(id, data) : unitsAPI.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['units'] });
      navigate('/units');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      company_id: Number(data.company_id),
      project_id: Number(data.project_id),
      max_position: Number(data.max_position),
      current_hm: data.current_hm ? Number(data.current_hm) : 0,
    };
    saveMutation.mutate(payload);
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const projects = projectsData?.data?.data || projectsData?.data || [];
  const unitTypes = unitTypesData?.data?.data || unitTypesData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/units')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit Unit' : 'New Unit'}
          subtitle={isEdit ? 'Update unit information' : 'Add a new unit'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingUnit && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Unit ID" required error={errors.unit_id?.message}>
                  <Input
                    placeholder="e.g. BWB051"
                    {...register('unit_id')}
                    error={errors.unit_id?.message}
                  />
                </FormField>

                <FormField label="Type" required error={errors.unit_type?.message}>
                  <Select
                    options={unitTypes.map((t) => ({ value: t.unit_type, label: t.display_name }))}
                    placeholder="Select type"
                    {...register('unit_type')}
                    error={errors.unit_type?.message}
                  />
                </FormField>

                <FormField label="Company" required error={errors.company_id?.message}>
                  <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select company"
                    disabled={!isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label="Project" required error={errors.project_id?.message}>
                  <Select
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="Select project"
                    {...register('project_id')}
                    error={errors.project_id?.message}
                  />
                </FormField>

                <FormField label="Unit Model" error={errors.unit_model?.message}>
                  <Input
                    placeholder="e.g. SANY SKT 105S"
                    {...register('unit_model')}
                    error={errors.unit_model?.message}
                  />
                </FormField>

                <FormField label="Plate Number" error={errors.plate_number?.message}>
                  <Input
                    placeholder="e.g. BK 1234 ABC"
                    {...register('plate_number')}
                    error={errors.plate_number?.message}
                  />
                </FormField>

                <FormField label="Tyre Size Default" required error={errors.tyre_size_default?.message}>
                  <Select
                    options={sizes.map((s) => ({ value: s.name, label: s.name }))}
                    placeholder="Select tyre size"
                    {...register('tyre_size_default')}
                    error={errors.tyre_size_default?.message}
                  />
                </FormField>

                <FormField label="Max Position" required error={errors.max_position?.message}>
                  <Input
                    type="number"
                    placeholder="e.g. 6"
                    {...register('max_position')}
                    error={errors.max_position?.message}
                  />
                </FormField>

                <FormField label="Status" error={errors.status?.message}>
                  <Select
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'maintenance', label: 'Maintenance' },
                    ]}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </FormField>

                <FormField label="Current HM" error={errors.current_hm?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register('current_hm')}
                    error={errors.current_hm?.message}
                  />
                </FormField>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || 'Failed to save unit.'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/units')}>
                  Cancel
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Unit' : 'Create Unit'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}