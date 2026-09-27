import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import SearchFilterBar from '@/components/list/SearchFilterBar';
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

const TYRE_STATUS_PILLS_ID = [
  { value: 'spare', label: 'Cadangan' },
  { value: 'mounted', label: 'Terpasang' },
  { value: 'dismounted', label: 'Lepas' },
  { value: 'scrap', label: 'Rusak' },
];

const TYRE_STATUS_PILLS_EN = [
  { value: 'spare', label: 'Spare' },
  { value: 'mounted', label: 'Mounted' },
  { value: 'dismounted', label: 'Dismounted' },
  { value: 'scrap', label: 'Scrap' },
];

export default function TyreListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperadmin } = usePermission();
  const isIndonesian = i18n.language === 'id';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [companyId, setCompanyId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [sortBy, setSortBy] = useState('serial_number');
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
    if (brandId) p.brand_id = brandId;
    if (sizeId) p.size_id = sizeId;
    if (effectiveCompanyId) p.company_id = effectiveCompanyId;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [page, perPage, sortBy, sortOrder, status, brandId, sizeId, effectiveCompanyId, search]);

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

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));
  const sizeOptions = sizes.map((s) => ({ value: s.id, label: s.name }));
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const statusPills = isIndonesian ? TYRE_STATUS_PILLS_ID : TYRE_STATUS_PILLS_EN;

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const getStatusBadge = (statusValue) => {
    const statusLabel = statusValue
      ? t(`tyre.status.${statusValue}`, statusValue)
      : '-';
    return <Badge variant={statusValue || 'default'} size="sm">{statusLabel}</Badge>;
  };

  const columns = [
    {
      key: 'barcode',
      header: t('tyre.label.barcode'),
      sortable: true,
      render: (v) => <span className="font-mono text-xs">{v || '-'}</span>,
    },
    {
      key: 'serial_number',
      header: t('tyre.label.serialNumber'),
      sortable: true,
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      key: 'brand',
      header: t('tyre.label.brand'),
      render: (_, row) => row.brand?.name || row.brand_name || '-',
    },
    {
      key: 'size',
      header: t('tyre.label.size'),
      render: (_, row) => row.size?.name || row.size_name || '-',
    },
    {
      key: 'pattern',
      header: t('tyre.label.pattern'),
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
      header: t('common.label.status'),
      sortable: true,
      render: (v) => getStatusBadge(v),
    },
    {
      key: 'unit_id',
      header: t('tyre.label.mountedUnit'),
      render: (_, row) => {
        const u = row.unit;
        if (!u) return '-';
        return `${u.unit_model} (${u.unit_id})`;
      },
    },
    {
      key: 'mounted_position',
      header: t('tyre.label.position'),
      render: (v) => v || '-',
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => navigate(`/tyres/${row.id}`)}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title={t('common.button.view')}
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/tyres/${row.id}/edit`)}
        className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
        title={t('common.button.edit')}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setDeleteTarget(row)}
        className="p-1.5 rounded text-red-600 hover:bg-red-50"
        title={t('common.button.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tyre.title.list')}
        subtitle={t('tyre.subtitle.list')}
        actions={
          <Button onClick={() => navigate('/tyres/new')}>
            <Plus className="w-4 h-4" />
            {t('tyre.button.add')}
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 space-y-3">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('tyre.placeholder.search')}
            statusValue={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            statusOptions={[{ value: 'all', label: t('tyre.tab.all') }, ...statusPills]}
          >
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">{t('tyre.filter.brand')}:</label>
              <select
                value={brandId}
                onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
              >
                <option value="">{t('tyre.filter.allBrands')}</option>
                {brandOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">{t('tyre.filter.size')}:</label>
              <select
                value={sizeId}
                onChange={(e) => { setSizeId(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
              >
                <option value="">{t('tyre.filter.allSizes')}</option>
                {sizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {isSuperadmin() && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">{t('tyre.filter.company')}:</label>
                <select
                  value={companyId}
                  onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-40"
                >
                  <option value="">{t('tyre.filter.allCompanies')}</option>
                  {companyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </SearchFilterBar>
        </div>

        <DataTable
          columns={columns}
          data={tyres}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actions={actions}
          emptyIcon={TyreIcon}
          emptyTitle={t('tyre.empty.title')}
          emptyMessage={search || status !== 'all' ? t('tyre.empty.searchMatch') : t('tyre.empty.message')}
          emptyAction={search || status !== 'all' ? undefined : () => navigate('/tyres/new')}
          emptyActionLabel={search || status !== 'all' ? undefined : t('tyre.button.add')}
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
        title={t('tyre.confirm.deleteTitle')}
        message={t('tyre.confirm.deleteMessage', { name: deleteTarget?.serial_number })}
        confirmText={t('common.button.delete')}
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
