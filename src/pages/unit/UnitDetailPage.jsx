import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Truck, Plus, History } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/list/DataTable';
import { unitsAPI } from '@/api/units';
import { tyresAPI } from '@/api/tyres';
import { replacementsAPI } from '@/api/replacements';
import { usePermission } from '@/hooks/usePermission';
import { formatDate, formatNumber, titleCase } from '@/utils/format';
import { TYRE_STATUS_LABELS } from '@/utils/constants';

// Try to dynamically import TyrePositionCanvas (may not exist yet)
let TyrePositionCanvasComponent = null;
try {
  TyrePositionCanvasComponent = require('@/components/tyre/TyrePositionCanvas').default;
} catch (e) {
  TyrePositionCanvasComponent = null;
}

export default function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperadmin } = usePermission();
  const [canvasAvailable] = useState(Boolean(TyrePositionCanvasComponent));

  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ['unit', id],
    queryFn: () => unitsAPI.get(id),
    enabled: Boolean(id),
  });

  const { data: tyresData, isLoading: tyresLoading } = useQuery({
    queryKey: ['unit-tyres', id],
    queryFn: () => tyresAPI.list({ unit_id: id, status: 'mounted' }),
    enabled: Boolean(id),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['unit-replacement-history', id],
    queryFn: () =>
      replacementsAPI.list({
        unit_id: id,
        per_page: 5,
        sort_by: 'replacement_date',
        sort_order: 'desc',
      }),
    enabled: Boolean(id),
  });

  const unit = unitData?.data?.data || unitData?.data;
  const mountedTyres = tyresData?.data?.data || tyresData?.data || [];
  const historyItems = historyData?.data?.data || historyData?.data || [];
  const historyMeta = historyData?.data?.meta || historyData?.meta || {};

  const getRtdBadgeVariant = (rtd) => {
    if (rtd === null || rtd === undefined) return 'default';
    if (rtd < 5) return 'scrap';
    if (rtd < 10) return 'dismounted';
    if (rtd < 20) return 'warning';
    return 'spare';
  };

  const tyreColumns = [
    {
      key: 'position',
      header: 'Position',
      align: 'center',
      render: (v) => <Badge variant="default" size="sm">{v || '-'}</Badge>,
    },
    {
      key: 'serial_number',
      header: 'Serial Number',
      render: (v) => <span className="font-medium text-gray-900">{v || '-'}</span>,
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
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={v === 'mounted' ? 'mounted' : v || 'default'} size="sm">
          {TYRE_STATUS_LABELS[v] || titleCase(v)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/tyres/${row.id}`)}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="View Tyre"
          >
            <TyreIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: 'replacement_date',
      header: 'Date',
      render: (v) => formatDate(v),
    },
    {
      key: 'position',
      header: 'Position',
      align: 'center',
      render: (v) => <Badge variant="default" size="sm">{v || '-'}</Badge>,
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
      key: 'hm',
      header: 'HM',
      align: 'right',
      render: (_, row) => formatNumber(row.hm || row.new_tyre_hm || 0, 0),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/units')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {unitLoading ? 'Loading...' : unit?.plate_number || `Unit #${id}`}
            </h1>
            {!unitLoading && unit?.code && (
              <p className="text-sm text-gray-500">Code: {unit.code}</p>
            )}
          </div>
        </div>
        {unit && (
          <div className="flex items-center gap-2">
            <Badge
              variant={unit.status === 'active' ? 'active' : unit.status === 'maintenance' ? 'maintenance' : 'inactive'}
            >
              {titleCase(unit.status)}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/units/${id}/edit`)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Unit Information</CardTitle>
            </CardHeader>
            <CardBody>
              {unitLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : unit ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Plate Number</p>
                      <p className="text-sm font-semibold text-gray-900">{unit.plate_number || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Code</p>
                      <p className="text-sm text-gray-900">{unit.code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Type</p>
                      <p className="text-sm text-gray-900">{unit.vehicle_type || unit.unit_type?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Project</p>
                      <p className="text-sm text-gray-900">{unit.project?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Company</p>
                      <p className="text-sm text-gray-900">{unit.company?.name || unit.project?.company?.name || '-'}</p>
                    </div>
                  </div>

                  {unit.max_position && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Max Positions</p>
                      <p className="text-sm text-gray-900">{unit.max_position}</p>
                    </div>
                  )}

                  {unit.hm_current != null && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Current HM</p>
                      <p className="text-sm text-gray-900">{formatNumber(unit.hm_current, 0)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unit not found.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Tyre Canvas / Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mounted Tyres</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate(`/units/${id}/tyres`)}>
                  <Plus className="w-4 h-4" />
                  Manage Tyres
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {mountedTyres.length > 0 ? (
                <div className="overflow-x-auto">
                  <DataTable
                    columns={tyreColumns}
                    data={mountedTyres}
                    loading={tyresLoading}
                    emptyIcon={TyreIcon}
                    emptyTitle="No mounted tyres"
                    emptyMessage="This unit has no tyres mounted on it."
                    skeletonRows={3}
                  />
                </div>
              ) : !tyresLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <TyreIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">No tyres mounted</p>
                  <p className="text-xs text-gray-500 mb-3">This unit currently has no tyres mounted.</p>
                  <Button size="sm" onClick={() => navigate(`/units/${id}/tyres`)}>
                    <Plus className="w-4 h-4" />
                    Mount Tyre
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent Replacement History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              <CardTitle>Recent Replacement History</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/replacements?unit_id=${id}`)}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {historyItems.length > 0 ? (
            <div className="overflow-x-auto">
              <DataTable
                columns={historyColumns}
                data={historyItems}
                loading={historyLoading}
                emptyIcon={History}
                emptyTitle="No replacement history"
                emptyMessage="No replacement records found for this unit."
                skeletonRows={3}
              />
            </div>
          ) : !historyLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <History className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No replacement history</p>
              <p className="text-xs text-gray-500 mt-1">Replacement records for this unit will appear here.</p>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
