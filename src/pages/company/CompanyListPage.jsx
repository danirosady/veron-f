import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Building2, Eye } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import SearchFilterBar from '@/components/list/SearchFilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { companiesAPI } from '@/api/companies';
import { usePermission } from '@/hooks/usePermission';
import { titleCase } from '@/utils/format';

export default function CompanyListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperadmin } = usePermission();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = useMemo(() => {
    const p = {
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (status && status !== 'all') p.status = status;
    return p;
  }, [page, perPage, sortBy, sortOrder, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companiesAPI.list(params),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeleteTarget(null);
    },
  });

  const companies = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? companies.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const columns = [
    {
      key: 'name',
      header: t('company.label.name'),
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.code && (
            <div className="text-xs text-gray-500">Code: {row.code}</div>
          )}
        </div>
      ),
    },
    {
      key: 'contact_person',
      header: t('company.label.contactPerson'),
      render: (v) => v || '-',
    },
    {
      key: 'phone',
      header: t('company.label.phone'),
      render: (v) => v || '-',
    },
    {
      key: 'email',
      header: t('company.label.email'),
      render: (v) => v || '-',
    },
    {
      key: 'status',
      header: t('common.label.status'),
      sortable: true,
      render: (v) => (
        <Badge variant={v === 'active' ? 'active' : 'inactive'} size="sm">
          {v === 'active' ? t('common.status.active') : t('common.status.inactive')}
        </Badge>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/companies/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title={t('common.button.view') || 'View'}
      >
        <Eye className="w-4 h-4" />
      </button>
      {isSuperadmin() && (
        <>
          <button
            onClick={() => navigate(`/companies/${row.id}/edit`)}
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
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('company.title.list')}
        subtitle={t('company.subtitle.list')}
        actions={
          isSuperadmin() && (
            <Button onClick={() => navigate('/companies/new')}>
              <Plus className="w-4 h-4" />
              {t('company.button.add')}
            </Button>
          )
        }
      />

      <Card padding={false}>
        <div className="p-4">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('company.placeholder.search') || 'Search companies...'}
            statusValue={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            statusOptions={[
              { value: 'all', label: t('company.filter.all') || 'All' },
              { value: 'active', label: t('common.status.active') },
              { value: 'inactive', label: t('common.status.inactive') },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={Building2}
          emptyTitle={t('company.empty.title')}
          emptyMessage={search ? t('company.empty.search') : t('company.empty.message')}
          emptyAction={isSuperadmin() ? () => navigate('/companies/new') : undefined}
          emptyActionLabel={isSuperadmin() ? t('company.button.add') : undefined}
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
        title={t('company.confirm.deleteTitle')}
        message={t('company.confirm.deleteMessage', { name: deleteTarget?.name })}
        confirmText={t('common.button.delete')}
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
