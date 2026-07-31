import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import {
  Building2,
  FolderKanban,
  Truck,
  Users,
  CircleDot,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { dashboardAPI } from '@/api/dashboard';
import { usePermission } from '@/hooks/usePermission';

function StatCard({ icon: Icon, label, value, sublabel, colorClass }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${colorClass || 'text-gray-900'}`}>
            {value ?? 0}
          </p>
          {sublabel && (
            <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass ? colorClass.replace('text-', 'bg-').replace('900', '100') : 'bg-gray-100'}`}>
          <Icon className={`w-6 h-6 ${colorClass || 'text-gray-600'}`} />
        </div>
      </div>
    </Card>
  );
}

function TyreHealthBar({ mounted, spare, scrap, total }) {
  if (!total || total === 0) return null;
  const mountedPct = Math.round((mounted / total) * 100);
  const sparePct = Math.round((spare / total) * 100);
  const scrapPct = 100 - mountedPct - sparePct;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Tyre Status Distribution</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Mounted</span>
            <span>{mounted} ({mountedPct}%)</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mountedPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Spare</span>
            <span>{spare} ({sparePct}%)</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${sparePct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Scrap</span>
            <span>{scrap} ({scrapPct}%)</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.max(0, scrapPct)}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { isSuperadmin } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  if (!isSuperadmin()) {
    return <Navigate to="/units" replace />;
  }

  const stats = data?.data?.data || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-1" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><Skeleton className="h-24" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of your tyre management system
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Companies"
          value={stats.total_companies}
          colorClass="text-blue-600"
        />
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={stats.total_projects}
          colorClass="text-purple-600"
        />
        <StatCard
          icon={Truck}
          label="Total Units"
          value={stats.total_units}
          colorClass="text-teal-600"
        />
        <StatCard
          icon={Users}
          label="Total Drivers"
          value={stats.total_drivers}
          colorClass="text-orange-600"
        />
      </div>

      {/* Tyre Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CircleDot}
          label="Total Tyres"
          value={stats.total_tyres}
          sublabel={`${stats.mounted_tyres} mounted, ${stats.spare_tyres} spare`}
          colorClass="text-indigo-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Mounted Tyres"
          value={stats.mounted_tyres}
          colorClass="text-emerald-600"
        />
        <StatCard
          icon={CircleDot}
          label="Spare Tyres"
          value={stats.spare_tyres}
          colorClass="text-amber-600"
        />
        <StatCard
          icon={RefreshCw}
          label="Replacements"
          value={stats.total_replacements}
          sublabel={`${stats.replacements_this_month} this month`}
          colorClass="text-pink-600"
        />
      </div>

      {/* Tyre Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TyreHealthBar
          mounted={stats.mounted_tyres}
          spare={stats.spare_tyres}
          scrap={stats.scrap_tyres}
          total={stats.total_tyres}
        />
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Scrap Tyres</span>
              <span className="text-sm font-semibold text-red-600">{stats.scrap_tyres}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Replacements This Month</span>
              <span className="text-sm font-semibold text-blue-600">{stats.replacements_this_month}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Mount Rate</span>
              <span className="text-sm font-semibold text-emerald-600">
                {stats.total_tyres > 0
                  ? `${Math.round((stats.mounted_tyres / stats.total_tyres) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Avg Tyres per Unit</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.total_units > 0
                  ? (stats.total_tyres / stats.total_units).toFixed(1)
                  : '0'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
