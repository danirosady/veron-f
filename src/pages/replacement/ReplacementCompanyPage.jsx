import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, MapPin, FolderKanban } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { companiesAPI } from '@/api/companies';

function CompanyCard({ company, onClick }) {
  return (
    <Card
      className="hover:shadow-md cursor-pointer transition-shadow"
      padding={false}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{company.name}</h3>
          </div>
          <Badge variant={company.status === 'active' ? 'active' : 'inactive'}>
            {company.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {company.address && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{company.address}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mt-3 pt-3 border-t border-gray-100">
          <FolderKanban className="w-4 h-4 text-gray-400" />
          <span>{company.total_projects} projects</span>
        </div>
      </div>
    </Card>
  );
}

export default function ReplacementCompanyPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['replacement-companies'],
    queryFn: () => companiesAPI.listWithProjects({ per_page: 100 }),
  });

  const companies = data?.data?.data || [];
  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Select Company</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a company to view its projects for tyre replacement
        </p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
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
          icon={Building2}
          title="No companies found"
          description={search ? 'Try a different search term' : 'No companies available'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => navigate(`/replacement/companies/${company.id}/projects`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
