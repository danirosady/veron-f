import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Truck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { unitsAPI } from '@/api/units';
import { TyreIcon } from '@/components/icons';

function UnitCard({ unit, onClick }) {
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
      className="hover:shadow-md cursor-pointer transition-shadow"
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
          <Badge variant={unit.status === 'active' ? 'active' : 'inactive'}>
            {unit.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <p className="text-sm text-gray-500 mb-3">{unit.unit_model}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {good > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              Good: {good}
            </span>
          )}
          {warning > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              Warn: {warning}
            </span>
          )}
          {critical > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              Crit: {critical}
            </span>
          )}
          {good === 0 && warning === 0 && critical === 0 && (
            <span className="text-xs text-gray-400">No tyres</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <TyreIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{health}</span>
            <span className="text-gray-400">/ {unit.max_position}</span>
          </div>
          {spare > 0 && (
            <span className="text-xs text-gray-400">· {spare} spare</span>
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
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: unitsData, isLoading } = useQuery({
    queryKey: ['replacement-units'],
    queryFn: () => unitsAPI.list({ per_page: 100 }),
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
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link
            to="/replacement"
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Projects
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Units</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Select Unit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a unit to manage tyre replacement
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search unit ID, plate, or model..."
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
            <UnitCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No units found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No units in this project'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onClick={() => navigate(`/units/${unit.id}/tyres`, { state: { from: 'replacement' } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
