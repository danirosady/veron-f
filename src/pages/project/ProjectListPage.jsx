import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FolderKanban, Eye } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import SearchFilterBar from '@/components/list/SearchFilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { projectsAPI } from '@/api/projects';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatDate } from '@/utils/format';

const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
];

const PROJECT_STATUS_OPTIONS_ID = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'completed', label: 'Selesai' },
];

const PROJECT_STATUS_OPTIONS_EN = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isIndonesian = i18n.language === 'id';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [companyId, setCompanyId] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Restrict company filter for non-superadmins
  const effectiveCompanyId = useMemo(() => {
    if (!isSuperadmin()) return user?.company_id || '';
    return companyId;
  }, [companyId, isSuperadmin, user]);

  const params = useMemo(() => {
    const p = {
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (status && status !== 'all') p.status = status;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    return p;
  }, [page, perPage, sortBy, sortOrder, status, effectiveCompanyId]);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsAPI.list(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
    },
  });

  const projects = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? projects.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const statusOptions = isIndonesian ? PROJECT_STATUS_OPTIONS_ID : PROJECT_STATUS_OPTIONS_EN;

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
    );
  }, [projects, search]);

  const getStatusBadge = (status) => {
    const variant = status === 'active' ? 'active' : status === 'completed' ? 'completed' : 'inactive';
    const label = status === 'active'
      ? t('common.status.active')
      : status === 'completed'
        ? t('common.status.completed')
        : t('common.status.inactive');
    return <Badge variant={variant} size="sm">{label}</Badge>;
  };

  const columns = [
    {
      key: 'name',
      header: t('project.label.name'),
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'company',
      header: t('project.label.company'),
      render: (_, row) => row.company?.name || '-',
    },
    {
      key: 'location',
      header: t('project.label.location'),
      render: (v) => v || '-',
    },
    {
      key: 'start_date',
      header: t('project.label.startDate'),
      render: (v) => formatDate(v),
    },
    {
      key: 'end_date',
      header: t('project.label.endDate'),
      render: (v) => formatDate(v),
    },
    {
      key: 'status',
      header: t('common.label.status'),
      sortable: true,
      render: (v) => getStatusBadge(v),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/projects/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title={t('common.button.view')}
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/projects/${row.id}/edit`)}
        className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
        title={t('common.button.edit')}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setDeleteTarget(row)}
        className="p-1.5 rounded text-red-600 hover:bg-red-50"
        title={t('common.button.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const statusPillOptions = [
    { value: 'all', label: isIndonesian ? 'Semua' : 'All' },
    ...statusOptions,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('project.title.list')}
        subtitle={t('project.subtitle.list')}
        actions={
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4" />
            {t('project.button.add')}
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 space-y-3">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('project.placeholder.search') || 'Search projects...'}
            statusValue={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            statusOptions={statusPillOptions}
          >
            {isSuperadmin() && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  {t('project.label.company')}:
                </label>
                <select
                  value={companyId}
                  onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
                >
                  <option value="">{isIndonesian ? 'Semua Perusahaan' : 'All Companies'}</option>
                  {companyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </SearchFilterBar>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={FolderKanban}
          emptyTitle={t('project.empty.title')}
          emptyMessage={search ? t('project.empty.search') : t('project.empty.message')}
          emptyAction={() => navigate('/projects/new')}
          emptyActionLabel={t('project.button.add')}
        />
        {totalItems > 0 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title={t('project.confirm.deleteTitle')}
        message={t('project.confirm.deleteMessage', { name: deleteTarget?.name })}
        confirmText={t('common.button.delete')}
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
