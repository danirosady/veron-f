import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users, Eye } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { driversAPI } from '@/api/drivers';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { COMMON_STATUS_OPTIONS } from '@/utils/constants';
import { titleCase } from '@/utils/format';

export default function DriverListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({ status: '', company_id: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const effectiveCompanyId = useMemo(() => {
    if (!isSuperadmin()) return user?.company_id || '';
    return filters.company_id;
  }, [filters.company_id, isSuperadmin, user]);

  const params = useMemo(() => {
    const p = {
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (filters.status) p.status = filters.status;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

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
  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', company_id: '' });
    setPage(1);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      key: 'employee_id',
      header: 'Employee ID',
      render: (v) => v || '-',
    },
    {
      key: 'company',
      header: 'Company',
      render: (_, row) => row.company?.name || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (v) => v || '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <Badge variant={v === 'active' ? 'active' : 'inactive'} size="sm">
          {titleCase(v)}
        </Badge>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/drivers/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/drivers/${row.id}/edit`)}
        className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setDeleteTarget(row)}
        className="p-1.5 rounded text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const filterDefs = [
    { key: 'status', label: 'Status', type: 'select', options: COMMON_STATUS_OPTIONS },
  ];
  if (isSuperadmin()) {
    filterDefs.push({
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: companyOptions,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        subtitle="Manage drivers across companies"
        actions={
          <Button onClick={() => navigate('/drivers/new')}>
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        }
      />

      <FilterBar
        filters={filterDefs}
        values={filters}
        onChange={(v) => { setFilters(v); setPage(1); }}
        onReset={handleResetFilters}
      />

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={drivers}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={Users}
          emptyTitle="No drivers found"
          emptyMessage="There are no drivers matching your filters yet."
          emptyAction={() => navigate('/drivers/new')}
          emptyActionLabel="Add Driver"
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
        title="Delete Driver"
        message={`Are you sure you want to delete driver "${deleteTarget?.name}"?`}
        confirmText="Delete"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}