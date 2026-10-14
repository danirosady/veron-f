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
import { employeesAPI } from '@/api/employees';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  employee_id: z.string().max(50).optional().or(z.literal('')),
  company_id: z.string().min(1, 'Company is required'),
  phone: z.string().max(50).optional().or(z.literal('')),
  role: z.enum(['driver', 'supervisor', 'tyreman']),
  status: z.enum(['active', 'inactive']).default('active'),
});

const ROLE_OPTIONS = [
  { value: 'driver', labelKey: 'employee.role.driver' },
  { value: 'supervisor', labelKey: 'employee.role.supervisor' },
  { value: 'tyreman', labelKey: 'employee.role.tyreman' },
];

export default function EmployeeFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);
  const { setBreadcrumb } = useBreadcrumb();

  const { data: employeeData, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesAPI.get(id),
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
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      employee_id: '',
      company_id: user?.company_id ? String(user.company_id) : '',
      phone: '',
      role: 'driver',
      status: 'active',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (employeeData && isEdit) {
      const e = employeeData.data?.data || employeeData.data;
      reset({
        name: e.name || '',
        employee_id: e.employee_id || '',
        company_id: e.company_id ? String(e.company_id) : '',
        phone: e.phone || '',
        role: e.role || 'driver',
        status: e.status || 'active',
      });
      setBreadcrumb(e.name || `Employee #${id}`);
    }
  }, [employeeData, isEdit, id, reset, setBreadcrumb]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? employeesAPI.update(id, data) : employeesAPI.create(data),
  });

  const onSubmit = async (data) => {
    try {
      await saveMutation.mutateAsync({
        ...data,
        company_id: Number(data.company_id),
      });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/employees?role=${getValues('role')}`);
    } catch (err) {
      // error handled by form-level error display
    }
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/employees?role=${getValues('role')}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? t('employee.title.edit') : t('employee.title.create')}
          subtitle={isEdit ? t('employee.subtitle.edit') : t('employee.subtitle.create')}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingEmployee && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t('employee.label.name')} required error={errors.name?.message}>
                  <Input
                    placeholder={t('employee.placeholder.name')}
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label={t('employee.label.employeeId')} error={errors.employee_id?.message}>
                  <Input
                    placeholder={t('employee.placeholder.employeeId')}
                    {...register('employee_id')}
                    error={errors.employee_id?.message}
                  />
                </FormField>

                <FormField label={t('employee.label.company')} required error={errors.company_id?.message}>
                  <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder={t('employee.placeholder.selectCompany')}
                    disabled={!isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label={t('employee.label.phone')} error={errors.phone?.message}>
                  <Input
                    placeholder={t('employee.placeholder.phone')}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </FormField>

                <FormField label={t('employee.label.role')} required error={errors.role?.message}>
                  <Select
                    options={ROLE_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey) }))}
                    {...register('role')}
                    error={errors.role?.message}
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
                <Button variant="outline" type="button" onClick={() => navigate(`/employees?role=${getValues('role')}`)}>
                  {t('common.button.cancel')}
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? t('employee.button.update') : t('employee.button.create')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
