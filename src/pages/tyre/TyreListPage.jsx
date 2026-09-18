import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import SearchInput from '@/components/form/SearchInput';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { tyresAPI } from '@/api/tyres';
import { companiesAPI } from '@/api/companies';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { TYRE_STATUS_OPTIONS } from '@/utils/constants';
import { formatNumber, getRtdColor } from '@/utils/format';

export default function TyreListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    status: '',
    company_id: '',
    brand_id: '',
    size_id: '',
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('serial_number');
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
    if (filters.brand_id) p.brand_id = filters.brand_id;
    if (filters.size_id) p.size_id = filters.size_id;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    if (search) p.search = search;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['tyres', params],
    queryFn: () => tyresAPI.list(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['master', 'brands', { all: true }],
    queryFn: () => masterAPI.listBrands({ per_page: 200 }),
  });

  const { data: sizesData } = useQuery({
    queryKey: ['master', 'sizes', { all: true }],
    queryFn: () => masterAPI.listSizes({ per_page: 200 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tyresAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tyres'] });
      setDeleteTarget(null);
    },
  });

  const tyres = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? tyres.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  const companies = companiesData?.data?.data || companiesData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', company_id: '', brand_id: '', size_id: '' });
    setSearch('');
    setPage(1);
  };

  const columns = [
    {
      key: 'barcode',
      header: 'Barcode',
      sortable: true,
      render: (v) => <span className="font-mono text-xs">{v || '-'}</span>,
    },
    {
      key: 'serial_number',
      header: 'Serial Number',
      sortable: true,
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (_, row) => row.brand?.name || row.brand_name || '-',
    },
    {
      key: 'size',
      header: 'Size',
      render: (_, row) => row.size?.name || row.size_name || '-',
    },
    {
      key: 'pattern',
      header: 'Pattern',
      render: (_, row) => row.pattern?.name || row.pattern_name || '-',
    },
    {
      key: 'otd',
      header: 'OTD',
      align: 'right',
      render: (v) => formatNumber(v ?? null, 1),
    },
    {
      key: 'rtd',
      header: 'RTD',
      align: 'right',
      render: (v) => {
        const rtd = v ?? (typeof v === 'number' ? v : null);
        if (rtd === null || rtd === undefined) return '-';
        const colorVariant = getRtdColor(rtd);
        return (
          <Badge variant={colorVariant} size="sm">
            {formatNumber(rtd, 1)}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => <Badge variant={v || 'default'} size="sm">{v || '-'}</Badge>,
    },
    {
      key: 'unit_id',
      header: 'Mounted Unit',
      render: (_, row) => {
        const u = row.unit;
        if (!u) return '-';
        return `${u.unit_model} (${u.unit_id})`;
      },
    },
    {
      key: 'mounted_position',
      header: 'Position',
      render: (v) => v || '-',
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/tyres/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/tyres/${row.id}/edit`)}
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
    { key: 'status', label: 'Status', type: 'select', options: TYRE_STATUS_OPTIONS },
    { key: 'brand_id', label: 'Brand', type: 'select', options: [
      { value: '', label: 'All Brands' },
      ...brands.map((b) => ({ value: b.id, label: b.name })),
    ] },
    { key: 'size_id', label: 'Size', type: 'select', options: [
      { value: '', label: 'All Sizes' },
      ...sizes.map((s) => ({ value: s.id, label: s.name })),
    ] },
  ];
  if (isSuperadmin()) {
    filterDefs.push({
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: [
        { value: '', label: 'All Companies' },
        ...companies.map((c) => ({ value: c.id, label: c.name })),
      ],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tyres"
        subtitle="Manage all tyres in the system"
        actions={
          <Button onClick={() => navigate('/tyres/new')}>
            <Plus className="w-4 h-4" />
            Add Tyre
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by barcode or serial number..."
            />
          </div>
        </div>
        <FilterBar
          filters={filterDefs}
          values={filters}
          onChange={(v) => { setFilters(v); setPage(1); }}
          onReset={handleResetFilters}
          className="border-0 rounded-none"
        />
      </Card>

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={tyres}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={TyreIcon}
          emptyTitle="No tyres found"
          emptyMessage="There are no tyres matching your filters yet."
          emptyAction={() => navigate('/tyres/new')}
          emptyActionLabel="Add Tyre"
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
        title="Delete Tyre"
        message={`Are you sure you want to delete tyre "${deleteTarget?.serial_number}"?`}
        confirmText="Delete"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}