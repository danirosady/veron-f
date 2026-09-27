import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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
  status: z.enum(['spare', 'mounted', 'dismounted', 'scrap']).default('spare'),
});

export default function TyreFormPage() {
  const { t } = useTranslation();
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
      status: 'spare',
    },
  });

  const types = typesData?.data?.data || typesData?.data || [];

  useEffect(() => {
    if (tyreData && isEdit) {
      const t_data = tyreData.data?.data || tyreData.data;
      // type is stored as string (e.g. "Radial"), match by name to find id
      const matchedType = types.find((tp) => tp.name === t_data.type);
      reset({
        serial_number: t_data.serial_number || '',
        barcode: t_data.barcode || '',
        company_id: t_data.company_id ? String(t_data.company_id) : '',
        brand_id: t_data.brand_id ? String(t_data.brand_id) : '',
        size_id: t_data.size_id ? String(t_data.size_id) : '',
        type_id: matchedType ? String(matchedType.id) : '',
        pattern_id: t_data.pattern_id ? String(t_data.pattern_id) : '',
        depth_new: t_data.rtd ? String(t_data.rtd) : '',
        cost: t_data.cost ? String(t_data.cost) : '',
        purchase_date: t_data.purchase_date ? t_data.purchase_date.substring(0, 10) : '',
        status: t_data.status || 'spare',
      });
    }
  }, [tyreData, isEdit, reset, types]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? tyresAPI.update(id, data) : tyresAPI.create(data),
    onSuccess: async () => {
      if (isEdit) {
        await queryClient.invalidateQueries({ queryKey: ['tyre', id] });
      }
      await queryClient.invalidateQueries({ queryKey: ['tyres'] });
      navigate('/tyres');
    },
  });

  const onSubmit = (data) => {
    const otd = Number(data.depth_new);

    if (isEdit) {
      // Edit: send all editable fields (only non-empty values)
      const rtd = Number(data.depth_new);
      const selectedType = types.find((tp) => String(tp.id) === String(data.type_id));
      const payload = {
        rtd,
        remarks: data.remarks || '',
      };
      if (data.brand_id) payload.brand_id = Number(data.brand_id);
      if (data.size_id) payload.size_id = Number(data.size_id);
      if (data.pattern_id) payload.pattern_id = Number(data.pattern_id);
      if (selectedType) payload.type = selectedType.name;
      saveMutation.mutate(payload);
    } else {
      // Create: full payload
      const payload = {
        serial_number: data.serial_number,
        barcode: data.barcode,
        company_id: data.company_id ? Number(data.company_id) : Number(user?.company_id),
        brand_id: Number(data.brand_id),
        size_id: Number(data.size_id),
        pattern_id: data.pattern_id ? Number(data.pattern_id) : null,
        otd: otd,
        rtd: otd,
        remarks: data.remarks || '',
      };
      saveMutation.mutate(payload);
    }
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];
  const patterns = patternsData?.data?.data || patternsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/tyres')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? t('tyre.title.edit') : t('tyre.title.create')}
          subtitle={isEdit ? t('tyre.subtitle.edit') : t('tyre.subtitle.create')}
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
                <FormField label={t('tyre.label.serialNumber')} required error={errors.serial_number?.message}>
                  <Input
                    placeholder={t('tyre.placeholder.serialNumber')}
                    {...register('serial_number')}
                    error={errors.serial_number?.message}
                    disabled={isEdit}
                    className={isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                </FormField>

                <FormField label={t('tyre.label.barcode')} error={errors.barcode?.message}>
                  <Input
                    placeholder={t('tyre.placeholder.barcode')}
                    {...register('barcode')}
                    error={errors.barcode?.message}
                    disabled={isEdit}
                    className={isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label={t('tyre.label.company')} error={errors.company_id?.message}>
                  <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder={t('tyre.placeholder.selectCompany')}
                    disabled={isEdit || !isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label={t('common.label.status')} error={errors.status?.message}>
                  <Select
                    options={[
                      { value: 'spare', label: t('tyre.status.spare') },
                      { value: 'mounted', label: t('tyre.status.mounted') },
                      { value: 'dismounted', label: t('tyre.status.dismounted') },
                      { value: 'scrap', label: t('tyre.status.scrap') },
                    ]}
                    {...register('status')}
                    disabled={isEdit}
                    error={errors.status?.message}
                  />
                </FormField>

                <FormField label={t('tyre.label.brand')} required error={errors.brand_id?.message}>
                  <Select
                    options={brands.map((b) => ({ value: b.id, label: b.name }))}
                    placeholder={t('tyre.placeholder.selectBrand')}
                    {...register('brand_id')}
                    error={errors.brand_id?.message}
                  />
                </FormField>

                <FormField label={t('tyre.label.size')} required error={errors.size_id?.message}>
                  <Select
                    options={sizes.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder={t('tyre.placeholder.selectSize')}
                    {...register('size_id')}
                    error={errors.size_id?.message}
                  />
                </FormField>

                <FormField label={t('tyre.label.type')} error={errors.type_id?.message}>
                  <Select
                    options={types.map((tp) => ({ value: tp.id, label: tp.name }))}
                    placeholder={t('tyre.placeholder.selectType')}
                    {...register('type_id')}
                    error={errors.type_id?.message}
                  />
                </FormField>

                <FormField label={t('tyre.label.pattern')} error={errors.pattern_id?.message}>
                  <Select
                    options={patterns.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder={t('tyre.placeholder.selectPattern')}
                    {...register('pattern_id')}
                    error={errors.pattern_id?.message}
                  />
                </FormField>

                <FormField label={isEdit ? t('tyre.label.rtd') : t('tyre.label.otd')} required error={errors.depth_new?.message}>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={isEdit ? t('tyre.placeholder.rtd') : t('tyre.placeholder.otd')}
                    {...register('depth_new')}
                    error={errors.depth_new?.message}
                  />
                </FormField>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || t('errors.saveError')}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/tyres')}>
                  {t('common.button.cancel')}
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? t('tyre.button.update') : t('tyre.button.create')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
