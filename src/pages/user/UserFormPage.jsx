import React, { useEffect, useState } from 'react';
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
import { usersAPI } from '@/api/users';
import { companiesAPI } from '@/api/companies';
import { usePermission } from '@/hooks/usePermission';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').or(z.string().min(0)),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  role: z.enum(['superadmin', 'admin_company']),
  company_id: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
}).refine(
  (data) => {
    if (data.role === 'admin_company') {
      return data.company_id && data.company_id.length > 0;
    }
    return true;
  },
  { message: 'Company wajib dipilih untuk Admin Company', path: ['company_id'] }
);

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.get(id),
    enabled: isEdit,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const companies = companiesData?.data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'admin_company',
      company_id: '',
      status: 'active',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (userData && isEdit) {
      const u = userData.data?.data || userData.data;
      reset({
        name: u.name || '',
        email: u.email || '',
        password: '',
        role: u.role || 'admin_company',
        company_id: u.company_id ? String(u.company_id) : '',
        status: u.status || 'active',
      });
    }
  }, [userData, isEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (data.company_id) {
        payload.company_id = parseInt(data.company_id, 10);
      } else {
        payload.company_id = null;
      }
      if (isEdit && !data.password) {
        delete payload.password;
      }
      return isEdit ? usersAPI.update(id, payload) : usersAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  const companyOptions = [
    { value: '', label: 'Select Company' },
    ...companies.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const roleOptions = [
    { value: 'superadmin', label: 'Superadmin' },
    { value: 'admin_company', label: 'Admin Company' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit User' : 'New User'}
          subtitle={isEdit ? 'Update user information' : 'Add a new user to the system'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingUser && isEdit ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Name" required error={errors.name?.message}>
                  <Input
                    placeholder="Full name"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label="Email" required error={errors.email?.message}>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </FormField>

                <FormField
                  label={isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
                  required={!isEdit}
                  error={errors.password?.message}
                >
                  <Input
                    type="password"
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Minimal 6 karakter'}
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </FormField>

                <FormField label="Role" required error={errors.role?.message}>
                  <Select
                    options={roleOptions}
                    {...register('role')}
                    error={errors.role?.message}
                  />
                </FormField>

                <FormField
                  label="Company"
                  required={selectedRole === 'admin_company'}
                  error={errors.company_id?.message}
                >
                  <Select
                    options={companyOptions}
                    value={watch('company_id') || ''}
                    onChange={(e) => setValue('company_id', e.target.value)}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label="Status" required error={errors.status?.message}>
                  <Select
                    options={statusOptions}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </FormField>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || saveMutation.error?.message || 'Failed to save user.'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/users')}>
                  Cancel
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
