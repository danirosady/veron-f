import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, History, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { reportsAPI } from '@/api/reports';
import { companiesAPI } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatDate, formatNumber, titleCase } from '@/utils/format';
import { REPLACEMENT_ACTIONS_OPTIONS } from '@/utils/constants';

export default function ReplacementReportPage() {
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    action: '',
    company_id: '',
    search: '',
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
    if (filters.start_date) p.start_date = filters.start_date;
    if (filters.end_date) p.end_date = filters.end_date;
    if (filters.action) p.action = filters.action;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    if (filters.search) p.search = filters.search;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', 'replacement', params],
    queryFn: () => reportsAPI.replacement(params),
    keepPreviousData: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { all: true }],
    queryFn: () => companiesAPI.list({ per_page: 200 }),
    enabled: isSuperadmin(),
  });

  const rows = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? rows.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));
  const companies = companiesData?.data?.data || companiesData?.data || [];

  // Summary stats
  const stats = useMemo(() => {
    const allRows = data?.data?.data || data?.data || [];
    const mounts = allRows.filter((r) => r.action === 'mount').length;
    const dismounts = allRows.filter((r) => r.action === 'dismount').length;
    const swaps = allRows.filter((r) => r.action === 'swap').length;
    return {
      total: allRows.length,
      mounts,
      dismounts,
      swaps,
    };
  }, [data]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ start_date: '', end_date: '', action: '', company_id: '', search: '' });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const exportParams = { ...params };
      delete exportParams.page;
      delete exportParams.per_page;
      const response = await reportsAPI.exportReplacement(exportParams);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `replacement-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
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
      render: (_, row) => (
        <div>
          <span className="font-medium text-gray-900">
            {row.unit?.plate_number || row.unit?.code || '-'}
          </span>
          {row.unit?.code && row.unit?.plate_number && row.unit?.plate_number !== row.unit?.code && (
            <span className="text-xs text-gray-500 ml-1">({row.unit.code})</span>
          )}
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      align: 'center',
      render: (v) => (v ? <Badge variant="default" size="sm">{v}</Badge> : '-'),
    },
    {
      key: 'action',
      header: 'Action',
      render: (v) => (
        <Badge
          variant={v === 'mount' ? 'mounted' : v === 'dismount' ? 'dismounted' : 'pending'}
          size="sm"
        >
          {titleCase(v)}
        </Badge>
      ),
    },
    {
      key: 'old_tyre',
      header: 'Old Tyre SN',
      render: (_, row) => row.old_tyre?.serial_number || '-',
    },
    {
      key: 'new_tyre',
      header: 'New Tyre SN',
      render: (_, row) => row.new_tyre?.serial_number || '-',
    },
    {
      key: 'tyre_spec',
      header: 'Brand / Size',
      render: (_, row) => {
        const brand = row.new_tyre?.brand_name || row.new_tyre?.brand?.name || '-';
        const size = row.new_tyre?.size_name || row.new_tyre?.size?.name || '-';
        return `${brand} / ${size}`;
      },
    },
    {
      key: 'rtd_before',
      header: 'RTD Before',
      align: 'right',
      render: (v) => (v != null ? formatNumber(v, 1) : '-'),
    },
    {
      key: 'rtd_after',
      header: 'RTD After',
      align: 'right',
      render: (v) => (v != null ? formatNumber(v, 1) : '-'),
    },
    {
      key: 'hm',
      header: 'HM',
      align: 'right',
      render: (_, row) => formatNumber(row.hm || row.new_tyre_hm || 0, 0),
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (_, row) => row.driver?.name || '-',
    },
    {
      key: 'operator',
      header: 'Operator',
      render: (_, row) => row.operator?.name || '-',
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (v) => v || '-',
    },
  ];

  const filterDefs = [
    { key: 'dateRange', label: 'Date Range', type: 'dateRange' },
    { key: 'action', label: 'Action', type: 'select', options: REPLACEMENT_ACTIONS_OPTIONS },
    { key: 'search', label: 'Unit / Plate Search', type: 'text', placeholder: 'Search unit...' },
  ];

  if (isSuperadmin()) {
    filterDefs.splice(1, 0, {
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: [{ value: '', label: 'All Companies' }, ...companies.map((c) => ({ value: c.id, label: c.name }))],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Replacement History Report"
        subtitle="Full audit trail of tyre mount, dismount, and swap events"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Replacements</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Mounts</p>
              <p className="text-xl font-bold text-gray-900">{stats.mounts}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Dismounts</p>
              <p className="text-xl font-bold text-gray-900">{stats.dismounts}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <History className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Swaps</p>
              <p className="text-xl font-bold text-gray-900">{stats.swaps}</p>
            </div>
          </div>
        </Card>
      </div>

      <FilterBar
        filters={filterDefs}
        values={filters}
        onChange={(v) => { setFilters(v); setPage(1); }}
        onReset={handleResetFilters}
      />

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyIcon={History}
          emptyTitle="No replacement records found"
          emptyMessage="There are no replacement records matching your filters."
          skeletonRows={5}
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
