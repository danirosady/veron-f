import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { reportsAPI } from '@/api/reports';
import { companiesAPI } from '@/api/companies';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatNumber, getRtdColor } from '@/utils/format';

export default function PotentialHMReportPage() {
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    company_id: '',
    brand_id: '',
    size_id: '',
    urgency: '',
  });

  const params = useMemo(() => {
    const p = {};
    if (filters.company_id) p.company_id = filters.company_id;
    if (filters.brand_id) p.brand_id = filters.brand_id;
    if (filters.size_id) p.size_id = filters.size_id;
    return p;
  }, [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'potential-hm', params],
    queryFn: () => reportsAPI.potentialHM(params),
    select: (res) => res.data?.data || res.data || [],
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companiesAPI.list({ per_page: 100 }),
    enabled: isSuperadmin(),
    select: (res) => res.data?.data || [],
  });

  const { data: brands } = useQuery({
    queryKey: ['master-brands'],
    queryFn: () => masterAPI.listBrands(),
    select: (res) => res.data?.data || [],
  });

  const { data: sizes } = useQuery({
    queryKey: ['master-sizes'],
    queryFn: () => masterAPI.listSizes(),
    select: (res) => res.data?.data || [],
  });

  const rows = Array.isArray(data) ? data : [];

  // Filter by urgency if set
  const filteredRows = useMemo(() => {
    if (!filters.urgency) return rows;
    return rows.filter((r) => r.status === filters.urgency);
  }, [rows, filters.urgency]);

  // Summary stats
  const avgWearRate = useMemo(() => {
    const withWear = rows.filter((r) => r.wear_rate > 0);
    if (withWear.length === 0) return 0;
    return withWear.reduce((sum, r) => sum + r.wear_rate, 0) / withWear.length;
  }, [rows]);
  const totalPotentialHM = rows.reduce((sum, r) => sum + (r.total_potential_hm || 0), 0);
  const urgentCount = rows.filter((r) => r.status === 'critical').length;

  const getUrgencyVariant = (status) => {
    if (status === 'critical') return 'scrap';
    if (status === 'warning') return 'pending';
    return 'default';
  };

  const columns = [
    {
      key: 'serial_number',
      header: 'Serial Number',
      render: (v) => (
        <span className="font-mono text-sm font-medium text-gray-900">{v || '-'}</span>
      ),
    },
    {
      key: 'brand',
      header: 'Brand / Size / Pattern',
      render: (_, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.brand || '-'}</p>
          <p className="text-gray-500 text-xs">{row.size || '-'} / {row.pattern || '-'}</p>
        </div>
      ),
    },
    {
      key: 'unit_code',
      header: 'Unit / Position',
      render: (_, row) => (
        <span className="text-sm">
          {row.unit_code ? `${row.unit_code}${row.position ? ` / ${row.position}` : ''}` : '-'}
        </span>
      ),
    },
    {
      key: 'otd',
      header: 'OTD',
      align: 'right',
      render: (v) => formatNumber(v, 1),
    },
    {
      key: 'rtd_at_mount',
      header: 'RTD at Mount',
      align: 'right',
      render: (v) => v > 0 ? formatNumber(v, 1) : '-',
    },
    {
      key: 'rtd_current',
      header: 'RTD Current',
      align: 'right',
      render: (v) => {
        const color = getRtdColor(v);
        const variant =
          color === 'spare' ? 'default' :
          color === 'warning' ? 'pending' :
          color === 'dismounted' ? 'dismounted' :
          color === 'scrap' ? 'scrap' : 'default';
        return <Badge variant={variant} size="sm">{formatNumber(v, 1)}</Badge>;
      },
    },
    {
      key: 'rtd_minimum',
      header: 'Min RTD',
      align: 'right',
      render: (v) => formatNumber(v, 1),
    },
    {
      key: 'wear_rate',
      header: 'Wear Rate',
      align: 'right',
      render: (v) => v > 0 ? `${formatNumber(v, 5)} mm/HM` : '-',
    },
    {
      key: 'total_life_hm',
      header: 'Total Life HM',
      align: 'right',
      render: (v) => formatNumber(v, 0),
    },
    {
      key: 'remaining_rtd',
      header: 'Remaining RTD',
      align: 'right',
      render: (v) => formatNumber(v, 1),
    },
    {
      key: 'potential_hm',
      header: 'Potential HM',
      align: 'right',
      render: (v) => v > 0 ? formatNumber(v, 0) : '-',
    },
    {
      key: 'total_potential_hm',
      header: 'Total Potential HM',
      align: 'right',
      render: (v) => (
        <span className="font-semibold text-gray-900">{v > 0 ? formatNumber(v, 0) : '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Urgency',
      render: (v) => (
        <Badge variant={getUrgencyVariant(v)} size="sm">
          {v === 'critical' ? 'Critical' : v === 'warning' ? 'Warning' : 'Good'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Potential HM Report</h1>
          <p className="text-sm text-gray-500 mt-1">Estimated remaining tyre life based on wear rate</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Wear Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {avgWearRate > 0 ? `${formatNumber(avgWearRate, 5)} mm/HM` : '-'}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Potential HM</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalPotentialHM, 0)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical (RTD &lt; 5mm)</p>
              <p className="text-xl font-bold text-red-600">{urgentCount}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            {isSuperadmin() && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Company</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  value={filters.company_id}
                  onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                >
                  <option value="">All Companies</option>
                  {(companies || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Urgency</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="good">Good</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Brand</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={filters.brand_id}
                onChange={(e) => setFilters({ ...filters, brand_id: e.target.value })}
              >
                <option value="">All Brands</option>
                {(brands || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Size</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={filters.size_id}
                onChange={(e) => setFilters({ ...filters, size_id: e.target.value })}
              >
                <option value="">All Sizes</option>
                {(sizes || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            data={filteredRows}
            loading={isLoading}
            skeletonRows={10}
            emptyIcon={Package}
            emptyTitle="No tyres found"
            emptyMessage="No mounted tyres match the selected filters."
          />
        </CardBody>
      </Card>
    </div>
  );
}
