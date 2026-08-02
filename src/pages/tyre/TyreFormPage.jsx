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
import { tyresAPI } from '@/api/tyres';
import { companiesAPI } from '@/api/companies';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

const tyreSchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required').max(100),
  barcode: z.string().max(100).optional().or(z.literal('')),
  company_id: z.string().optional(),
  brand_id: z.string().min(1, 'Brand is required'),
  size_id: z.string().min(1, 'Size is required'),
  type_id: z.string().optional().or(z.literal('')),
  pattern_id: z.string().optional().or(z.literal('')),
  depth_new: z.string().min(1, 'OTD is required'),
  cost: z.string().optional().or(z.literal('')),
  purchase_date: z.string().optional().or(z.literal('')),
  status: z.enum(['new_tyre', 'spare', 'mounted', 'dismounted', 'repair', 'scrap']).default('new_tyre'),
});

export default function TyreFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);

  const { data: tyreData, isLoading: loadingTyre } = useQuery({
    queryKey: ['tyre', id],
    queryFn: () => tyresAPI.get(id),
    enabled: isEdit,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['master', 'brands', { all: true }],
    queryFn: () => masterAPI.listBrands({ per_page: 200 }),
  });

  const { data: sizesData } = useQuery({
    queryKey: ['master', 'sizes', { all: true }],
    queryFn: () => masterAPI.listSizes({ per_page: 200 }),
  });

  const { data: typesData } = useQuery({
    queryKey: ['master', 'types', { all: true }],
    queryFn: () => masterAPI.listTypes({ per_page: 200 }),
  });

  const { data: patternsData } = useQuery({
    queryKey: ['master', 'patterns', { all: true }],
    queryFn: () => masterAPI.listPatterns({ per_page: 200 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tyreSchema),
    defaultValues: {
      serial_number: '',
      barcode: '',
      company_id: user?.company_id ? String(user.company_id) : '',
      brand_id: '',
      size_id: '',
      type_id: '',
      pattern_id: '',
      depth_new: '',
      cost: '',
      purchase_date: '',
      status: 'new_tyre',
    },
  });

  useEffect(() => {
    if (tyreData && isEdit) {
      const t = tyreData.data?.data || tyreData.data;
      reset({
        serial_number: t.serial_number || '',
        barcode: t.barcode || '',
        company_id: t.company_id ? String(t.company_id) : '',
        brand_id: t.brand_id ? String(t.brand_id) : '',
        size_id: t.size_id ? String(t.size_id) : '',
        type_id: t.type_id ? String(t.type_id) : '',
        pattern_id: t.pattern_id ? String(t.pattern_id) : '',
        depth_new: t.otd ? String(t.otd) : '',
        cost: t.cost ? String(t.cost) : '',
        purchase_date: t.purchase_date ? t.purchase_date.substring(0, 10) : '',
        status: t.status || 'new_tyre',
      });
    }
  }, [tyreData, isEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? tyresAPI.update(id, data) : tyresAPI.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tyres'] });
      navigate('/tyres');
    },
  });

  const onSubmit = (data) => {
    console.log('[DEBUG] Form data:', data);
    const otd = Number(data.depth_new);
    const payload = {
      serial_number: data.serial_number,
      barcode: data.barcode,
      company_id: data.company_id ? Number(data.company_id) : Number(user?.company_id),
      brand_id: Number(data.brand_id),
      size_id: Number(data.size_id),
      pattern_id: data.pattern_id ? Number(data.pattern_id) : null,
      otd: otd,
      rtd: otd,
      cost: data.cost ? Number(data.cost) : 0,
      remarks: data.remarks || '',
    };
    console.log('[DEBUG] Payload:', payload);
    saveMutation.mutate(payload);
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];
  const types = typesData?.data?.data || typesData?.data || [];
  const patterns = patternsData?.data?.data || patternsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/tyres')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit Tyre' : 'New Tyre'}
          subtitle={isEdit ? 'Update tyre information' : 'Add a new tyre to inventory'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingTyre && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Serial Number" required error={errors.serial_number?.message}>
                  <Input
                    placeholder="Serial number"
                    {...register('serial_number')}
                    error={errors.serial_number?.message}
                  />
                </FormField>

                <FormField label="Barcode" error={errors.barcode?.message}>
                  <Input
                    placeholder="Barcode (optional)"
                    {...register('barcode')}
                    error={errors.barcode?.message}
                  />
                </FormField>

                <FormField label="Company" required={isSuperadmin()} error={errors.company_id?.message}>
                  <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select company"
                    disabled={!isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label="Status" error={errors.status?.message}>
                  <Select
                    options={[
                      { value: 'new_tyre', label: 'New Tyre' },
                      { value: 'spare', label: 'Spare' },
                      { value: 'mounted', label: 'Mounted' },
                      { value: 'dismounted', label: 'Dismounted' },
                      { value: 'repair', label: 'Repair' },
                      { value: 'scrap', label: 'Scrap' },
                    ]}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </FormField>

                <FormField label="Brand" required error={errors.brand_id?.message}>
                  <Select
                    options={brands.map((b) => ({ value: b.id, label: b.name }))}
                    placeholder="Select brand"
                    {...register('brand_id')}
                    error={errors.brand_id?.message}
                  />
                </FormField>

                <FormField label="Size" required error={errors.size_id?.message}>
                  <Select
                    options={sizes.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder="Select size"
                    {...register('size_id')}
                    error={errors.size_id?.message}
                  />
                </FormField>

                <FormField label="Type" error={errors.type_id?.message}>
                  <Select
                    options={types.map((t) => ({ value: t.id, label: t.name }))}
                    placeholder="Select type"
                    {...register('type_id')}
                    error={errors.type_id?.message}
                  />
                </FormField>

                <FormField label="Pattern" error={errors.pattern_id?.message}>
                  <Select
                    options={patterns.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="Select pattern"
                    {...register('pattern_id')}
                    error={errors.pattern_id?.message}
                  />
                </FormField>

                <FormField label="Original Tread Depth (OTD)" required error={errors.depth_new?.message}>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 25.0"
                    {...register('depth_new')}
                    error={errors.depth_new?.message}
                  />
                </FormField>

                <FormField label="Cost" error={errors.cost?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('cost')}
                    error={errors.cost?.message}
                  />
                </FormField>

                <FormField label="Purchase Date" error={errors.purchase_date?.message}>
                  <Input
                    type="date"
                    {...register('purchase_date')}
                    error={errors.purchase_date?.message}
                  />
                </FormField>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || 'Failed to save tyre.'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/tyres')}>
                  Cancel
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Tyre' : 'Create Tyre'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}