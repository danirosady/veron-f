import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Package, AlertTriangle, CircleDot, Truck, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import FilterBar from '@/components/list/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { reportsAPI } from '@/api/reports';
import { companiesAPI } from '@/api/companies';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatDate, formatNumber, formatPercent, calculatePercentWorn, getRtdColor } from '@/utils/format';
import { TYRE_STATUS_OPTIONS } from '@/utils/constants';

export default function InventoryReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    status: '',
    company_id: '',
    brand_id: '',
    size_id: '',
  });
  const [sortBy, setSortBy] = useState('serial_number');
  const [sortOrder, setSortOrder] = useState('asc');
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
    if (filters.status) p.status = filters.status;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    if (filters.brand_id) p.brand_id = filters.brand_id;
    if (filters.size_id) p.size_id = filters.size_id;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', 'inventory', params],
    queryFn: () => reportsAPI.inventory(params),
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

  const rows = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? rows.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));
  const companies = companiesData?.data?.data || companiesData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];

  // Summary stats
  const stats = useMemo(() => {
    const allRows = data?.data?.data || data?.data || [];
    const total = allRows.length;
    const mounted = allRows.filter((r) => r.status === 'mounted').length;
    const spare = allRows.filter((r) => r.status === 'spare' || r.status === 'new_tyre').length;
    const scrap = allRows.filter((r) => r.status === 'scrap').length;
    const critical = allRows.filter((r) => {
      const rtd = r.rtd;
      return rtd !== null && rtd !== undefined && rtd < 8;
    }).length;
    return { total, mounted, spare, scrap, critical };
  }, [data]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', company_id: '', brand_id: '', size_id: '' });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const exportParams = { ...params };
      delete exportParams.page;
      delete exportParams.per_page;
      const response = await reportsAPI.exportInventory(exportParams);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getRtdBadgeVariant = (rtd) => {
    if (rtd === null || rtd === undefined) return 'default';
    if (rtd < 8) return 'scrap';
    if (rtd < 15) return 'pending';
    return 'spare';
  };

  const getProgressColor = (pctWorn) => {
    if (pctWorn === null || pctWorn === undefined) return 'bg-gray-200';
    if (pctWorn >= 80) return 'bg-red-500';
    if (pctWorn >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const columns = [
    {
      key: 'barcode',
      header: 'Barcode',
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <Badge variant={v === 'mounted' ? 'mounted' : v || 'default'} size="sm">
          {v ? v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-'}
        </Badge>
      ),
    },
    {
      key: 'otd',
      header: 'OTD',
      align: 'right',
      render: (v) => formatNumber(v, 1),
    },
    {
      key: 'rtd',
      header: 'RTD',
      align: 'right',
      render: (v) => {
        if (v === null || v === undefined) return '-';
        return (
          <Badge variant={getRtdBadgeVariant(v)} size="sm">
            {formatNumber(v, 1)}
          </Badge>
        );
      },
    },
    {
      key: 'pct_worn',
      header: '% Worn',
      align: 'right',
      render: (_, row) => {
        const otd = row.depth_new;
        const rtd = row.rtd;
        if (otd == null || rtd == null) return '-';
        const pct = calculatePercentWorn(otd, rtd);
        return (
          <div className="flex items-center gap-2 justify-end">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(pct)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 w-10 text-right">{formatNumber(pct, 0)}%</span>
          </div>
        );
      },
    },
    {
      key: 'unit',
      header: 'Mounted Unit',
      render: (_, row) => {
        if (!row.unit) return <span className="text-gray-400">-</span>;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/units/${row.unit.id}`); }}
            className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
          >
            {row.unit.plate_number || row.unit.code || '-'}
          </button>
        );
      },
    },
    {
      key: 'position',
      header: 'Position',
      align: 'center',
      render: (v) => (v ? <Badge variant="default" size="sm">{v}</Badge> : '-'),
    },
    {
      key: 'mount_date',
      header: 'Last Mount Date',
      render: (v) => formatDate(v),
    },
  ];

  const filterDefs = [
    { key: 'status', label: 'Status', type: 'select', options: TYRE_STATUS_OPTIONS },
    { key: 'brand_id', label: 'Brand', type: 'select', options: [{ value: '', label: 'All Brands' }, ...brands.map((b) => ({ value: b.id, label: b.name }))] },
    { key: 'size_id', label: 'Size', type: 'select', options: [{ value: '', label: 'All Sizes' }, ...sizes.map((s) => ({ value: s.id, label: s.name }))] },
  ];
  if (isSuperadmin()) {
    filterDefs.push({
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: [{ value: '', label: 'All Companies' }, ...companies.map((c) => ({ value: c.id, label: c.name }))],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Report"
        subtitle="Current tyre stock by status, brand, size, and location"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Tyres</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Mounted</p>
              <p className="text-xl font-bold text-gray-900">{stats.mounted}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Spare</p>
              <p className="text-xl font-bold text-gray-900">{stats.spare}</p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Scrap</p>
              <p className="text-xl font-bold text-gray-900">{stats.scrap}</p>
            </div>
          </div>
        </Card>
        <Card padding className={stats.critical > 0 ? 'ring-2 ring-red-200' : ''}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.critical > 0 ? 'bg-red-50' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${stats.critical > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Critical (RTD &lt;8mm)</p>
              <p className={`text-xl font-bold ${stats.critical > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.critical}
              </p>
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
          onRowClick={(row) => navigate(`/tyres/${row.id}`)}
          emptyIcon={Package}
          emptyTitle="No tyres found"
          emptyMessage="There are no tyres matching your filters."
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
