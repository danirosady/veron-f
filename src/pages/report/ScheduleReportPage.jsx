import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
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
import { formatDate, formatNumber, getRtdColor, calculatePercentWorn } from '@/utils/format';

export default function ScheduleReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    company_id: '',
    brand_id: '',
    size_id: '',
    urgency: '',
  });
  const [sortBy, setSortBy] = useState('rtd');
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
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    if (filters.brand_id) p.brand_id = filters.brand_id;
    if (filters.size_id) p.size_id = filters.size_id;
    if (filters.urgency) p.urgency = filters.urgency;
    return p;
  }, [page, perPage, sortBy, sortOrder, filters, effectiveCompanyId]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', 'schedule', params],
    queryFn: () => reportsAPI.schedule(params),
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
    fn: () => masterAPI.listSizes({ per_page: 200 }),
  });

  const rows = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || {};
  const totalItems = meta.total ?? rows.length;
  const totalPages = meta.last_page ?? Math.max(1, Math.ceil(totalItems / perPage));
  const companies = companiesData?.data?.data || companiesData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const sizes = sizesData?.data?.data || sizesData?.data || [];

  // Client-side calculations for schedule data
  const processedRows = useMemo(() => {
    return rows.map((row) => {
      const otd = row.depth_new ?? row.otd;
      const rtd = row.rtd;
      const mountDate = row.mount_date || row.mountDate;

      let wearRate = row.wear_rate;
      let estimatedEndDate = row.estimated_end_date;
      let daysRemaining = row.days_remaining;
      let urgency = row.urgency;

      // Calculate wear rate if not provided by API
      if (!wearRate && otd != null && rtd != null && mountDate) {
        const monthsSinceMount = Math.max(
          (new Date() - new Date(mountDate)) / (1000 * 60 * 60 * 24 * 30),
          1
        );
        wearRate = (otd - rtd) / monthsSinceMount;
      }

      // Calculate estimated end date and days remaining
      if (!estimatedEndDate && wearRate && wearRate > 0 && rtd != null && otd != null) {
        const remainingDepth = rtd;
        const remainingMonths = remainingDepth / wearRate;
        daysRemaining = Math.round(remainingMonths * 30);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysRemaining);
        estimatedEndDate = endDate.toISOString().split('T')[0];
      }

      // Determine urgency if not provided
      if (!urgency) {
        if (rtd != null && rtd < 8) {
          urgency = 'critical';
        } else if (rtd != null && rtd < 15) {
          urgency = 'warning';
        } else {
          urgency = 'good';
        }
      }

      let recommendedAction = row.recommended_action;
      if (!recommendedAction) {
        if (urgency === 'critical') {
          recommendedAction = 'Replace Soon';
        } else if (urgency === 'warning') {
          recommendedAction = 'Monitor';
        } else {
          recommendedAction = 'OK';
        }
      }

      return {
        ...row,
        _wearRate: wearRate,
        _estimatedEndDate: estimatedEndDate,
        _daysRemaining: daysRemaining,
        _urgency: urgency,
        _recommendedAction: recommendedAction,
      };
    });
  }, [rows]);

  // Summary stats
  const stats = useMemo(() => {
    const allRows = processedRows;
    const scheduled = allRows.filter((r) => r._urgency === 'critical' || r._urgency === 'warning').length;
    const critical = allRows.filter((r) => r._urgency === 'critical').length;
    const daysArr = allRows
      .filter((r) => r._daysRemaining != null && r._daysRemaining > 0)
      .map((r) => r._daysRemaining);
    const avgDays = daysArr.length > 0
      ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length)
      : 0;
    return { scheduled, critical, avgDays };
  }, [processedRows]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ company_id: '', brand_id: '', size_id: '', urgency: '' });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const exportParams = { ...params };
      delete exportParams.page;
      delete exportParams.per_page;
      const response = await reportsAPI.exportSchedule(exportParams);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="scrap" size="sm">CRITICAL - Replace Soon</Badge>;
      case 'warning':
        return <Badge variant="pending" size="sm">WARNING - Monitor</Badge>;
      case 'good':
        return <Badge variant="spare" size="sm">GOOD</Badge>;
      default:
        return <Badge variant="default" size="sm">{urgency}</Badge>;
    }
  };

  const getRtdBadgeVariant = (rtd) => {
    if (rtd === null || rtd === undefined) return 'default';
    if (rtd < 8) return 'scrap';
    if (rtd < 15) return 'pending';
    return 'spare';
  };

  const columns = [
    {
      key: 'serial_number',
      header: 'Serial Number',
      sortable: true,
      render: (v, row) => (
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/tyres/${row.id}`); }}
            className="font-medium text-gray-900 hover:text-primary-600 hover:underline"
          >
            {v}
          </button>
        </div>
      ),
    },
    {
      key: 'spec',
      header: 'Brand / Size / Pattern',
      render: (_, row) => {
        const brand = row.brand?.name || row.brand_name || '-';
        const size = row.size?.name || row.size_name || '-';
        const pattern = row.pattern?.name || row.pattern_name || '-';
        return (
          <div className="text-sm">
            <span className="text-gray-900">{brand}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-600">{size}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-500">{pattern}</span>
          </div>
        );
      },
    },
    {
      key: 'unit',
      header: 'Current Unit',
      render: (_, row) => {
        if (!row.unit) return <span className="text-gray-400">Spare</span>;
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
      key: 'rtd',
      header: 'Current RTD',
      align: 'right',
      sortable: true,
      render: (v) => {
        if (v === null || v === undefined) return '-';
        return (
          <Badge variant={getRtdBadgeVariant(v)} size="sm">
            {formatNumber(v, 1)} mm
          </Badge>
        );
      },
    },
    {
      key: 'wear_rate',
      header: 'Wear Rate',
      align: 'right',
      render: (_, row) => {
        const wr = row._wearRate;
        if (!wr) return '-';
        return <span className="text-sm text-gray-700">{formatNumber(wr, 2)} mm/mo</span>;
      },
    },
    {
      key: 'estimated_end_date',
      header: 'Est. End Date',
      sortable: true,
      render: (_, row) => {
        const d = row._estimatedEndDate;
        return d ? formatDate(d) : '-';
      },
    },
    {
      key: 'days_remaining',
      header: 'Days Remaining',
      align: 'right',
      sortable: true,
      render: (_, row) => {
        const days = row._daysRemaining;
        if (days == null) return '-';
        const colorClass = days <= 30 ? 'text-red-600 font-semibold' : days <= 60 ? 'text-yellow-600 font-medium' : 'text-gray-700';
        return <span className={`text-sm ${colorClass}`}>{days} days</span>;
      },
    },
    {
      key: 'urgency',
      header: 'Urgency',
      sortable: true,
      render: (_, row) => getUrgencyBadge(row._urgency),
    },
    {
      key: 'recommended_action',
      header: 'Recommended Action',
      render: (_, row) => (
        <span className="text-sm text-gray-700">{row._recommendedAction}</span>
      ),
    },
  ];

  const filterDefs = [
    { key: 'brand_id', label: 'Brand', type: 'select', options: [{ value: '', label: 'All Brands' }, ...brands.map((b) => ({ value: b.id, label: b.name }))] },
    { key: 'size_id', label: 'Size', type: 'select', options: [{ value: '', label: 'All Sizes' }, ...sizes.map((s) => ({ value: s.id, label: s.name }))] },
    {
      key: 'urgency',
      label: 'Urgency',
      type: 'select',
      options: [
        { value: '', label: 'All Levels' },
        { value: 'critical', label: 'Critical' },
        { value: 'warning', label: 'Warning' },
        { value: 'good', label: 'Good' },
      ],
    },
  ];
  if (isSuperadmin()) {
    filterDefs.unshift({
      key: 'company_id',
      label: 'Company',
      type: 'select',
      options: [{ value: '', label: 'All Companies' }, ...companies.map((c) => ({ value: c.id, label: c.name }))],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Report"
        subtitle="Upcoming tyre replacement schedule and RTD-based alerts"
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Scheduled (RTD &lt;15mm)</p>
              <p className="text-xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
          </div>
        </Card>
        <Card padding className={stats.critical > 0 ? 'ring-2 ring-red-200' : ''}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.critical > 0 ? 'bg-red-50' : 'bg-gray-100'}`}>
              <AlertCircle className={`w-5 h-5 ${stats.critical > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Critical (RTD &lt;8mm)</p>
              <p className={`text-xl font-bold ${stats.critical > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.critical}
              </p>
            </div>
          </div>
        </Card>
        <Card padding>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Avg. Days Until Replacement</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgDays || '-'}</p>
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
          data={processedRows}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyIcon={TyreIcon}
          emptyTitle="No tyres scheduled"
          emptyMessage="No tyres match the schedule criteria."
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
