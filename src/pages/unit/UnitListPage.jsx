import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Truck, Eye } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import SearchFilterBar from '@/components/list/SearchFilterBar';
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

const UNIT_STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function UnitListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sortBy, setSortBy] = useState('unit_id');
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
    if (projectId) p.project_id = projectId;
    return p;
  }, [page, perPage, sortBy, sortOrder, status, effectiveCompanyId, projectId]);

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

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.toLowerCase();
    return units.filter(
      (u) =>
        (u.unit_id || '').toLowerCase().includes(q) ||
        (u.plate_number || '').toLowerCase().includes(q) ||
        (u.unit_model || '').toLowerCase().includes(q)
    );
  }, [units, search]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
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
        <TyreIcon className="w-4 h-4" />
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

      <Card padding={false}>
        <div className="p-4 space-y-3">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by unit ID, plate, model..."
            statusValue={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            statusOptions={UNIT_STATUS_PILLS}
          >
            {isSuperadmin() && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Company:</label>
                <select
                  value={companyId}
                  onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
                >
                  <option value="">All Companies</option>
                  {companyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Project:</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
              >
                <option value="">All Projects</option>
                {projectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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
          emptyIcon={Truck}
          emptyTitle="No units found"
          emptyMessage={search || status !== 'all' ? "No units match your search or filter." : "There are no units yet."}
          emptyAction={search ? undefined : () => navigate('/units/new')}
          emptyActionLabel={search ? undefined : "Add Unit"}
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