import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Calendar,
  Truck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/api/projects';

function ProjectCard({ project, onClick }) {
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
            {project.status === 'active' ? 'Active' : 'Inactive'}
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
              {start || '—'} – {end || 'Ongoing'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-3 pt-3 border-t border-gray-100">
          <Truck className="w-4 h-4 text-gray-400" />
          <span>{project.total_units} units</span>
        </div>
      </div>
    </Card>
  );
}

export default function ReplacementProjectPage({ companyId, showBack }) {
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
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
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
              Companies
            </Link>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Projects</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Select Project</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a project to view its units for tyre replacement
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
          title="No projects found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No projects available'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/replacement/projects/${project.id}/units`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
