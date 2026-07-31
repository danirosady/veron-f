import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Eye, Filter as FilterIcon, ArrowRightLeft } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { replacementsAPI } from '@/api/replacements';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { REPLACEMENT_ACTIONS_OPTIONS } from '@/utils/constants';
import { formatDate, formatNumber, titleCase } from '@/utils/format';

export default function ReplacementListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    action: '',
    company_id: '',
  });
  const [sortBy, setSortBy] = useState('replacement_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

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
    if (filters.action) p.action = filters.action;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

  const { data, isLoading } = useQuery({
    queryKey: ['replacements', params],
    queryFn: () => replacementsAPI.list(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const replacements = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? replacements.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));

  const companies = companiesData?.data?.data || companiesData?.data || [];

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ action: '', company_id: '' });
    setPage(1);
  };

  const columns = [
    {
      key: 'replacement_date',
      header: 'Date',
      sortable: true,
      render: (v) => formatDate(v),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (_, row) => row.unit?.plate_number || row.unit?.code || '-',
    },
    {
      key: 'position',
      header: 'Position',
      render: (v) => v || '-',
    },
    {
      key: 'action',
      header: 'Action',
      render: (v) => <Badge variant="default" size="sm">{titleCase(v)}</Badge>,
    },
    {
      key: 'old_tyre',
      header: 'Old Tyre',
      render: (_, row) => row.old_tyre?.serial_number || '-',
    },
    {
      key: 'new_tyre',
      header: 'New Tyre',
      render: (_, row) => row.new_tyre?.serial_number || '-',
    },
    {
      key: 'hm',
      header: 'HM',
      align: 'right',
      render: (_, row) => formatNumber(row.new_tyre_hm || row.hm || 0, 0),
    },
    {
      key: 'operator',
      header: 'Operator',
      render: (_, row) => row.operator?.name || '-',
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/replacements/${row.id}/edit`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  const filterDefs = [
    { key: 'action', label: 'Action', type: 'select', options: REPLACEMENT_ACTIONS_OPTIONS },
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
        title="Replacements"
        subtitle="Mount, dismount, and swap tyre history"
        actions={
          <Button onClick={() => navigate('/replacements/new')}>
            <Plus className="w-4 h-4" />
            New Replacement
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
          data={replacements}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={RefreshCw}
          emptyTitle="No replacements found"
          emptyMessage="There are no replacement records yet."
          emptyAction={() => navigate('/replacements/new')}
          emptyActionLabel="New Replacement"
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
    </div>
  );
}