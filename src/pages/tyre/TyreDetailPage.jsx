import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Truck, Clock, TrendingDown } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/list/DataTable';
import { tyresAPI } from '@/api/tyres';
import { replacementsAPI } from '@/api/replacements';
import { formatDate, formatNumber, calculatePercentWorn, getRtdColor, titleCase } from '@/utils/format';
import { TYRE_STATUS_LABELS } from '@/utils/constants';

export default function TyreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tyreData, isLoading: tyreLoading } = useQuery({
    queryKey: ['tyre', id],
    queryFn: () => tyresAPI.get(id),
    enabled: Boolean(id),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['tyre-history', id],
    queryFn: () => tyresAPI.getHistory(id),
    enabled: Boolean(id),
  });

  const tyre = tyreData?.data?.data || tyreData?.data;
  const historyItems = historyData?.data?.data || historyData?.data || [];

  const rtd = tyre?.rtd;
  const otd = tyre?.depth_new;
  const percentWorn = (otd && rtd != null) ? calculatePercentWorn(otd, rtd) : null;

  const mountDate = tyre?.mount_date;
  const daysMounted = mountDate
    ? Math.floor((new Date() - new Date(mountDate)) / (1000 * 60 * 60 * 24))
    : null;

  const getRtdBadgeVariant = (val) => {
    const color = getRtdColor(val);
    if (color === 'spare') return 'spare';
    if (color === 'warning') return 'pending';
    if (color === 'dismounted') return 'dismounted';
    if (color === 'scrap') return 'scrap';
    return 'default';
  };

  const historyColumns = [
    {
      key: 'replacement_date',
      header: 'Date',
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
      key: 'hm',
      header: 'HM',
      align: 'right',
      render: (v) => formatNumber(v, 0),
    },
    {
      key: 'rtd',
      header: 'RTD at Event',
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
      key: 'remarks',
      header: 'Remarks',
      render: (v) => v || '-',
    },
  ];

  // Current mount info from tyre record
  const currentMount = tyre?.unit
    ? {
        unit: tyre.unit,
        position: tyre.position,
        mountDate: tyre.mount_date,
        mountHm: tyre.mount_hm,
        daysMounted,
      }
    : null;

  // Separate current mount from history
  const previousMounts = historyItems.filter((h) => h.id !== tyre?.current_replacement_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tyres')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tyreLoading ? 'Loading...' : tyre?.serial_number || `Tyre #${id}`}
            </h1>
            {!tyreLoading && tyre?.barcode && (
              <p className="text-sm text-gray-500">Barcode: {tyre.barcode}</p>
            )}
          </div>
        </div>
        {tyre && (
          <div className="flex items-center gap-2">
            <Badge variant={tyre.status === 'mounted' ? 'mounted' : tyre.status || 'default'}>
              {TYRE_STATUS_LABELS[tyre.status] || titleCase(tyre.status)}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/tyres/${id}/edit`)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Tyre Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tyre Information</CardTitle>
        </CardHeader>
        <CardBody>
          {tyreLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-24" />
                </div>
              ))}
            </div>
          ) : tyre ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Serial Number</p>
                <p className="text-sm font-semibold text-gray-900">{tyre.serial_number || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Barcode</p>
                <p className="text-sm text-gray-900 font-mono">{tyre.barcode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Brand</p>
                <p className="text-sm text-gray-900">{tyre.brand?.name || tyre.brand_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Size</p>
                <p className="text-sm text-gray-900">{tyre.size?.name || tyre.size_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pattern</p>
                <p className="text-sm text-gray-900">{tyre.pattern?.name || tyre.pattern_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Type</p>
                <p className="text-sm text-gray-900">{tyre.type?.name || tyre.type_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">OTD (New)</p>
                <p className="text-sm text-gray-900">{otd != null ? formatNumber(otd, 1) : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">RTD (Current)</p>
                <div>
                  {rtd != null ? (
                    <Badge variant={getRtdBadgeVariant(rtd)} size="lg">
                      {formatNumber(rtd, 1)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">% Worn</p>
                <p className="text-sm text-gray-900">
                  {percentWorn !== null ? formatNumber(percentWorn, 1) + '%' : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                <Badge
                  variant={tyre.status === 'mounted' ? 'mounted' : tyre.status || 'default'}
                >
                  {TYRE_STATUS_LABELS[tyre.status] || titleCase(tyre.status)}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Tyre not found.</p>
          )}
        </CardBody>
      </Card>

      {/* Current Mount Section */}
      {currentMount && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-500" />
              <CardTitle>Current Mount</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Unit</p>
                <p className="text-sm font-semibold text-gray-900">
                  {currentMount.unit.plate_number || currentMount.unit.code || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Position</p>
                <Badge variant="default" size="sm">{currentMount.position || '-'}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Mount Date</p>
                <p className="text-sm text-gray-900">{formatDate(currentMount.mountDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Mount HM</p>
                <p className="text-sm text-gray-900">
                  {currentMount.mountHm != null ? formatNumber(currentMount.mountHm, 0) : '-'}
                </p>
              </div>
              {daysMounted !== null && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Days Mounted</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{daysMounted} days</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Mount History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-500" />
            <CardTitle>Mount History</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          {historyItems.length > 0 ? (
            <div className="overflow-x-auto">
              <DataTable
                columns={historyColumns}
                data={historyItems}
                loading={historyLoading}
                emptyIcon={TyreIcon}
                emptyTitle="No mount history"
                emptyMessage="This tyre has no replacement history."
                skeletonRows={3}
              />
            </div>
          ) : !historyLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <TyreIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No mount history</p>
              <p className="text-xs text-gray-500 mt-1">Replacement history for this tyre will appear here.</p>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
