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
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/form/FormField';
import { projectsAPI } from '@/api/projects';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company_id: z.string().min(1, 'Company is required'),
  description: z.string().max(255).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'completed']).default('active'),
});

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isEdit = Boolean(id);

  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.get(id),
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
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      company_id: user?.company_id ? String(user.company_id) : '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (projectData && isEdit) {
      const p = projectData.data?.data || projectData.data;
      reset({
        name: p.name || '',
        company_id: p.company_id ? String(p.company_id) : '',
        description: p.description || '',
        location: p.location || '',
        start_date: p.start_date ? p.start_date.substring(0, 10) : '',
        end_date: p.end_date ? p.end_date.substring(0, 10) : '',
        status: p.status || 'active',
      });
    }
  }, [projectData, isEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? projectsAPI.update(id, data) : projectsAPI.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      company_id: Number(data.company_id),
    });
  };

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Edit Project' : 'New Project'}
          subtitle={isEdit ? 'Update project information' : 'Create a new project'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {loadingProject && isEdit ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Project Name" required error={errors.name?.message}>
                  <Input
                    placeholder="Enter project name"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label="Company" required error={errors.company_id?.message}>
                  <Select
                    options={companyOptions}
                    placeholder="Select company"
                    disabled={!isSuperadmin()}
                    {...register('company_id')}
                    error={errors.company_id?.message}
                  />
                </FormField>

                <FormField label="Location" error={errors.location?.message}>
                  <Input
                    placeholder="Project location"
                    {...register('location')}
                    error={errors.location?.message}
                  />
                </FormField>

                <FormField label="Status" error={errors.status?.message}>
                  <Select
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                    {...register('status')}
                    error={errors.status?.message}
                  />
                </FormField>

                <FormField label="Start Date" error={errors.start_date?.message}>
                  <Input
                    type="date"
                    {...register('start_date')}
                    error={errors.start_date?.message}
                  />
                </FormField>

                <FormField label="End Date" error={errors.end_date?.message}>
                  <Input
                    type="date"
                    {...register('end_date')}
                    error={errors.end_date?.message}
                  />
                </FormField>
              </div>

              <FormField label="Description" error={errors.description?.message}>
                <Textarea
                  rows={3}
                  placeholder="Project description (optional)"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </FormField>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveMutation.error?.response?.data?.message || 'Failed to save project.'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => navigate('/projects')}>
                  Cancel
                </Button>
                <Button type="submit" loading={saveMutation.isLoading}>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}