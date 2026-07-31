import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Truck, Eye, CircleDot } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { unitsAPI } from '@/api/units';
import { companiesAPI } from '@/api/companies';
import { projectsAPI } from '@/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatNumber, titleCase } from '@/utils/format';

const UNIT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function UnitListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    status: '',
    company_id: '',
    project_id: '',
  });
  const [sortBy, setSortBy] = useState('unit_id');
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
    if (filters.project_id) p.project_id = filters.project_id;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

  const { data, isLoading } = useQuery({
    queryKey: ['units', params],
    queryFn: () => unitsAPI.list(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', { all: true, company_id: effectiveCompanyId }],
    queryFn: () =>
      projectsAPI.list({
        per_page: 200,
        ...(effectiveCompanyId ? { company_id: effectiveCompanyId } : {}),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => unitsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setDeleteTarget(null);
    },
  });

  const units = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? units.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const projects = projectsData?.data?.data || projectsData?.data || [];

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];
  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', company_id: '', project_id: '' });
    setPage(1);
  };

  const columns = [
    {
      key: 'unit_id',
      header: 'Unit ID',
      sortable: true,
      render: (_, row) => (
        <div className="font-medium text-gray-900">{row.unit_id || row.id}</div>
      ),
    },
    {
      key: 'unit_model',
      header: 'Model',
      render: (_, row) => row.unit_model || '-',
    },
    {
      key: 'project',
      header: 'Project',
      render: (_, row) => row.project?.name || '-',
    },
    {
      key: 'unit_type',
      header: 'Type',
      render: (_, row) => row.unit_type || '-',
    },
    {
      key: 'max_position',
      header: 'Max Position',
      align: 'center',
      render: (v) => v ?? '-',
    },
    {
      key: 'current_hm',
      header: 'Current HM',
      align: 'right',
      render: (v) => formatNumber(v, 0),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <Badge
          variant={v === 'active' ? 'active' : v === 'maintenance' ? 'maintenance' : 'inactive'}
          size="sm"
        >
          {titleCase(v)}
        </Badge>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/units/${row.id}/tyres`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="View Tyres"
      >
        <CircleDot className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/units/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/units/${row.id}/edit`)}
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
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: UNIT_STATUS_OPTIONS,
    },
  ];
  if (isSuperadmin()) {
    filterDefs.push({
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: companyOptions,
    });
  }
  filterDefs.push({
    key: 'project_id',
    label: 'Project',
    type: 'select',
    options: projectOptions,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Units"
        subtitle="Manage vehicles (units) in projects"
        actions={
          <Button onClick={() => navigate('/units/new')}>
            <Plus className="w-4 h-4" />
            Add Unit
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
          data={units}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={Truck}
          emptyTitle="No units found"
          emptyMessage="There are no units matching your filters yet."
          emptyAction={() => navigate('/units/new')}
          emptyActionLabel="Add Unit"
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
        title="Delete Unit"
        message={`Are you sure you want to delete unit "${deleteTarget?.unit_id || deleteTarget?.id}"?`}
        confirmText="Delete"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}