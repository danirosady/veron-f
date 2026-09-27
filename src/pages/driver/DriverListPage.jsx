import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Users, Eye } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import SearchFilterBar from '@/components/list/SearchFilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { driversAPI } from '@/api/drivers';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

export default function DriverListPage() {
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
    queryKey: ['drivers', params],
    queryFn: () => driversAPI.list(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => driversAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteTarget(null);
    },
  });

  const drivers = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? drivers.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.employee_id || '').toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const variant = status === 'active' ? 'active' : 'inactive';
    const label = status === 'active'
      ? t('common.status.active')
      : t('common.status.inactive');
    return <Badge variant={variant} size="sm">{label}</Badge>;
  };

  const columns = [
    {
      key: 'name',
      header: t('driver.label.name'),
      sortable: true,
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      key: 'employee_id',
      header: t('driver.label.employeeId'),
      render: (v) => v || '-',
    },
    {
      key: 'company',
      header: t('driver.label.company'),
      render: (_, row) => row.company?.name || '-',
    },
    {
      key: 'phone',
      header: t('driver.label.phone'),
      render: (v) => v || '-',
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
        onClick={() => navigate(`/drivers/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title={t('common.button.view')}
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/drivers/${row.id}/edit`)}
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
    { value: 'all', label: t('driver.tab.all') },
    { value: 'active', label: t('driver.tab.active') },
    { value: 'inactive', label: t('driver.tab.inactive') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('driver.title.list')}
        subtitle={t('driver.subtitle.list')}
        actions={
          <Button onClick={() => navigate('/drivers/new')}>
            <Plus className="w-4 h-4" />
            {t('driver.button.add')}
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 space-y-3">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('driver.placeholder.search')}
            statusValue={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            statusOptions={statusPillOptions}
          >
            {isSuperadmin() && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">{t('driver.label.company')}:</label>
                <select
                  value={companyId}
                  onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
                >
                  <option value="">{isIndonesian ? 'Semua' : 'All'}</option>
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
          emptyIcon={Users}
          emptyTitle={t('driver.empty.title')}
          emptyMessage={search ? t('driver.empty.searchMatch') : t('driver.empty.message')}
          emptyAction={search ? undefined : () => navigate('/drivers/new')}
          emptyActionLabel={search ? undefined : t('driver.button.add')}
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
        title={t('driver.confirm.deleteTitle')}
        message={t('driver.confirm.deleteMessage', { name: deleteTarget?.name })}
        confirmText={t('common.button.delete')}
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
