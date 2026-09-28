import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import SearchFilterBar from '@/components/list/SearchFilterBar';
import { unitsAPI } from '@/api/units';
import { companiesAPI } from '@/api/companies';
import { projectsAPI } from '@/api/projects';
import { TyreIcon } from '@/components/icons';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

function UnitCard({ unit, onClick, t }) {
  const { data: statsData } = useQuery({
    queryKey: ['unit-tyre-stats', unit.id],
    queryFn: () => unitsAPI.getTyreStats(unit.id),
    enabled: !!unit.id,
  });

  const health = statsData?.data?.data?.mounted ?? 0;
  const good = statsData?.data?.data?.good ?? 0;
  const warning = statsData?.data?.data?.warning ?? 0;
  const critical = statsData?.data?.data?.critical ?? 0;
  const spare = statsData?.data?.data?.spare ?? 0;

  return (
    <Card
      className="hover:shadow-md cursor-pointer transition-shadow relative"
      padding={false}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{unit.unit_id}</h3>
            {unit.plate_number && (
              <p className="text-xs text-gray-400">{unit.plate_number}</p>
            )}
          </div>
          <Badge variant={unit.status === 'active' ? 'active' : unit.status === 'maintenance' ? 'maintenance' : 'inactive'}>
              
            {unit.status === 'active' ? t('common.status.active') : unit.status === 'maintenance' ? t('common.status.maintenance') : t('common.status.inactive')}
          </Badge>
          <div className="absolute bottom-6 right-6 opacity-75">
          <img src="/ADT_10POS.png" alt="ADT" className="w-36 h-36 object-contain" />
        </div>
        </div>
              

        <p className="text-sm text-gray-500 mb-3">{unit.unit_model}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {good > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              {t('replacement.label.good')}: {good}
            </span>
          )}
          {warning > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              {t('replacement.label.warning')}: {warning}
            </span>
          )}
          {critical > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {t('replacement.label.critical')}: {critical}
            </span>
          )}
          {good === 0 && warning === 0 && critical === 0 && (
            <span className="text-xs text-gray-400">{t('replacement.label.noTyres')}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <TyreIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{health}</span>
            <span className="text-gray-400">/ {unit.max_position}</span>
          </div>
          {spare > 0 && (
            <span className="text-xs text-gray-400">· {spare} {t('replacement.label.spare')}</span>
          )}
          {health < unit.max_position && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('replacement.label.unmounted', { count: unit.max_position - health })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function UnitCardSkeleton() {
  return (
    <Card padding={false}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32 mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  );
}

export default function ReplacementUnitPage() {
  const { t } = useTranslation();
  const { projectId, companyId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesAPI.get(companyId),
    enabled: Boolean(companyId),
  });

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (companyData) {
      const company = companyData.data?.data || companyData.data;
      if (company?.name) {
        setBreadcrumb(company.name, `/replacement/companies/${companyId}`);
      }
    }
    if (projectData) {
      const project = projectData.data?.data || projectData.data;
      if (project?.name) {
        setBreadcrumb(project.name, `/replacement/companies/${companyId}/projects/${projectId}`);
      }
    }
  }, [companyData, projectData, companyId, projectId, setBreadcrumb]);

  const { data: unitsData, isLoading } = useQuery({
    queryKey: ['replacement-units', projectId],
    queryFn: () => unitsAPI.list({ per_page: 100, project_id: projectId }),
    enabled: !!projectId,
  });

  const units = unitsData?.data?.data ?? [];

  const filtered = units.filter((u) => {
    const matchSearch =
      u.unit_id.toLowerCase().includes(search.toLowerCase()) ||
      (u.plate_number || '').toLowerCase().includes(search.toLowerCase()) ||
      u.unit_model.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { label: t('replacement.tab.all'), value: 'all' },
    { label: t('replacement.tab.active'), value: 'active' },
    { label: t('replacement.tab.inactive'), value: 'inactive' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link
            to={`/replacement/companies/${companyId}/projects`}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('replacement.nav.projects')}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{t('replacement.nav.units')}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('replacement.title.selectUnit')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('replacement.subtitle.unit')}
        </p>
      </div>

      <div className="mb-4">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('replacement.placeholder.searchUnit')}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={tabs}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <UnitCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t('replacement.empty.noUnit')}
          description={search || statusFilter !== 'all' ? t('replacement.empty.noUnitFilter') : t('replacement.empty.noUnitDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onClick={() => navigate(`/replacement/companies/${companyId}/projects/${projectId}/units/${unit.id}/tyres`)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
