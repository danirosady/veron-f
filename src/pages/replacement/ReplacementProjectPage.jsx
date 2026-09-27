import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Calendar,
  Truck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import SearchFilterBar from '@/components/list/SearchFilterBar';
import { projectsAPI } from '@/api/projects';

function ProjectCard({ project, onClick, t }) {
  const start = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const end = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Card
      className="hover:shadow-md cursor-pointer transition-shadow"
      padding={false}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <Badge variant={project.status === 'active' ? 'active' : 'inactive'}>
            {project.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
          </Badge>
        </div>

        {project.location && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{project.location}</span>
          </div>
        )}

        {(start || end) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span>
              {start || '—'} – {end || t('replacement.label.ongoing')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-3 pt-3 border-t border-gray-100">
          <Truck className="w-4 h-4 text-gray-400" />
          <span>{project.total_units} {t('replacement.label.units')}</span>
        </div>
      </div>
    </Card>
  );
}

export default function ReplacementProjectPage({ companyId, showBack }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['replacement-projects', companyId],
    queryFn: () => {
      const config = { per_page: 100 };
      if (companyId) config.company_id = companyId;
      return projectsAPI.listWithUnits(config);
    },
    enabled: true,
  });

  const projects = data?.data?.data || [];

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || p.status === statusFilter;
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
          {showBack && (
            <Link
              to="/replacement"
              className="flex items-center gap-1 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('replacement.nav.companies')}
            </Link>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{t('replacement.nav.projects')}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('replacement.title.selectProject')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('replacement.subtitle.project')}
        </p>
      </div>

      <div className="mb-4">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('replacement.placeholder.searchProject')}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={tabs}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t('replacement.empty.noProject')}
          description={search || statusFilter !== 'all' ? t('replacement.empty.noProjectFilter') : t('replacement.empty.noProjectDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/replacement/companies/${companyId}/projects/${project.id}/units`)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
