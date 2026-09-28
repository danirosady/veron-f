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
import { driversAPI } from '@/api/drivers';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  employee_id: z.string().max(50).optional().or(z.literal('')),
  company_id: z.string().min(1, 'Company is required'),
  phone: z.string().max(30).optional().or(z.literal('')),
  license_number: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export default function DriverFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);
  const { setBreadcrumb } = useBreadcrumb();

  const { data: driverData, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driversAPI.get(id),
    enabled: isEdit,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      employee_id: '',
      company_id: user?.company_id ? String(user.company_id) : '',
      phone: '',
      license_number: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (driverData && isEdit) {
      const d = driverData.data?.data || driverData.data;
      reset({
        name: d.name || '',
        employee_id: d.employee_id || '',
        company_id: d.company_id ? String(d.company_id) : '',
        phone: d.phone || '',
        license_number: d.license_number || '',
        status: d.status || 'active',
      });
      // Set breadcrumb
      setBreadcrumb(d.name || `Driver #${id}`);
    }
  }, [driverData, isEdit, id, reset, setBreadcrumb]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? driversAPI.update(id, data) : driversAPI.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      navigate('/drivers');
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      company_id: Number(data.company_id),
    });
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/drivers')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? t('driver.title.edit') : t('driver.title.create')}
          subtitle={isEdit ? t('driver.subtitle.edit') : t('driver.subtitle.create')}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingDriver && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t('driver.label.name')} required error={errors.name?.message}>
                  <Input
                    placeholder={t('driver.placeholder.name')}
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label={t('driver.label.employeeId')} error={errors.employee_id?.message}>
                  <Input
                    placeholder={t('driver.placeholder.employeeId')}
                    {...register('employee_id')}
                    error={errors.employee_id?.message}
                  />
                </FormField>

                <FormField label={t('driver.label.company')} required error={errors.company_id?.message}>
                  <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder={t('driver.placeholder.selectCompany')}
                    disabled={!isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label={t('driver.label.phone')} error={errors.phone?.message}>
                  <Input
                    placeholder={t('driver.placeholder.phone')}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </FormField>

                <FormField label={t('driver.label.licenseNumber')} error={errors.license_number?.message}>
                  <Input
                    placeholder={t('driver.placeholder.licenseNumber')}
                    {...register('license_number')}
                    error={errors.license_number?.message}
                  />
                </FormField>

                <FormField label={t('common.label.status')} error={errors.status?.message}>
                  <Select
                    options={[
                      { value: 'active', label: t('common.status.active') },
                      { value: 'inactive', label: t('common.status.inactive') },
                    ]}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </FormField>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || t('errors.saveError')}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/drivers')}>
                  {t('common.button.cancel')}
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? t('driver.button.update') : t('driver.button.create')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
