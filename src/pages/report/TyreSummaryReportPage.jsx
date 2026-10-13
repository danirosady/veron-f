import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Package, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { reportsAPI } from '@/api/reports';
import { companiesAPI } from '@/api/companies';
import { masterAPI } from '@/api/master';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { formatNumber, getRtdColor } from '@/utils/format';
import { TYRE_STATUS_LABELS, TYRE_STATUS_OPTIONS } from '@/utils/constants';

export default function TyreSummaryReportPage() {
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();

  const [filters, setFilters] = useState({
    status: '',
    company_id: '',
    brand_id: '',
    size_id: '',
  });

  const params = useMemo(() => {
    const p = {};
    if (filters.company_id) p.company_id = filters.company_id;
    if (filters.status) p.status = filters.status;
    if (filters.brand_id) p.brand_id = filters.brand_id;
    if (filters.size_id) p.size_id = filters.size_id;
    return p;
  }, [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'tyre-summary', params],
    queryFn: () => reportsAPI.tyreSummary(params),
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

  // Summary stats
  const totalTyres = rows.length;
  const avgCostPerHM = useMemo(() => {
    const withCost = rows.filter((r) => r.cost_per_hm > 0);
    if (withCost.length === 0) return 0;
    return withCost.reduce((sum, r) => sum + r.cost_per_hm, 0) / withCost.length;
  }, [rows]);
  const totalPotentialHM = rows.reduce((sum, r) => sum + (r.potential_hm || 0), 0);
  const criticalCount = rows.filter((r) => r.rtd < 5).length;

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
      key: 'total_life_hm',
      header: 'Total Life HM',
      align: 'right',
      render: (v) => formatNumber(v, 0),
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: (v) => v > 0 ? `$${formatNumber(v, 2)}` : '-',
    },
    {
      key: 'cost_per_hm',
      header: 'Cost/HM',
      align: 'right',
      render: (v) => v > 0 ? `$${formatNumber(v, 4)}` : '-',
    },
    {
      key: 'total_tread_used',
      header: 'Tread Used',
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
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={v === 'mounted' ? 'mounted' : v || 'default'} size="sm">
          {TYRE_STATUS_LABELS[v] || v}
        </Badge>
      ),
    },
    {
      key: 'current_unit',
      header: 'Unit / Position',
      render: (_, row) => (
        <span className="text-sm">
          {row.current_unit ? `${row.current_unit}${row.current_position ? ` / ${row.current_position}` : ''}` : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tyre Summary Report</h1>
          <p className="text-sm text-gray-500 mt-1">Cost per Hour Meter analysis per tyre</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tyres</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalTyres, 0)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Cost/HM</p>
              <p className="text-xl font-bold text-gray-900">
                {avgCostPerHM > 0 ? `$${formatNumber(avgCostPerHM, 4)}` : '-'}
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
              <p className="text-xl font-bold text-red-600">{criticalCount}</p>
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
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                {TYRE_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
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
            data={rows}
            loading={isLoading}
            skeletonRows={10}
            emptyIcon={Package}
            emptyTitle="No tyres found"
            emptyMessage="No tyres match the selected filters."
          />
        </CardBody>
      </Card>
    </div>
  );
}
