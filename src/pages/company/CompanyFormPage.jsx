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
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import { companiesAPI } from '@/api/companies';

const companySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().max(50).optional().or(z.literal('')),
  contact_person: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export default function CompanyFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: companyData, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesAPI.get(id),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (companyData && isEdit) {
      const c = companyData.data?.data || companyData.data;
      reset({
        name: c.name || '',
        code: c.code || '',
        contact_person: c.contact_person || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        status: c.status || 'active',
      });
    }
  }, [companyData, isEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? companiesAPI.update(id, data) : companiesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/companies');
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/companies')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? t('company.title.edit') : t('company.title.create')}
          subtitle={isEdit ? t('company.subtitle.edit') : t('company.subtitle.create')}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingCompany && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t('company.label.name')} required error={errors.name?.message}>
                  <Input
                    placeholder={t('company.placeholder.name')}
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label={t('company.label.code')} error={errors.code?.message}>
                  <Input
                    placeholder={t('company.placeholder.code')}
                    {...register('code')}
                    error={errors.code?.message}
                  />
                </FormField>

                <FormField label={t('company.label.contactPerson')} error={errors.contact_person?.message}>
                  <Input
                    placeholder={t('company.placeholder.contactPerson')}
                    {...register('contact_person')}
                    error={errors.contact_person?.message}
                  />
                </FormField>

                <FormField label={t('company.label.phone')} error={errors.phone?.message}>
                  <Input
                    placeholder={t('company.placeholder.phone')}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </FormField>

                <FormField label={t('company.label.email')} error={errors.email?.message}>
                  <Input
                    type="email"
                    placeholder={t('company.placeholder.email')}
                    {...register('email')}
                    error={errors.email?.message}
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

              <FormField label={t('company.label.address')} error={errors.address?.message}>
                <Textarea
                  rows={3}
                  placeholder={t('company.placeholder.address')}
                  {...register('address')}
                  error={errors.address?.message}
                />
              </FormField>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || t('errors.saveError')}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/companies')}>
                  {t('common.button.cancel')}
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? t('company.button.update') : t('company.button.create')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
