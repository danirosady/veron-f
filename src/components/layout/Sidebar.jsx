import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Truck,
  Users,
  RefreshCw,
  BarChart3,
  Database,
  LayoutGrid,
  UserCog,
  X,
  History,
  Boxes,
  CalendarClock,
} from 'lucide-react';
import { TyreIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  {
    section: 'Company',
    items: [
      {
        label: 'Tyre Replacement',
        path: '/replacement',
        icon: RefreshCw,
        roles: ['superadmin', 'admin_company'],
      },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['superadmin', 'admin_company'],
      },
      {
        label: 'Companies',
        path: '/companies',
        icon: Building2,
        roles: ['superadmin'],
      },
      {
        label: 'Projects',
        path: '/projects',
        icon: FolderKanban,
        roles: ['superadmin', 'admin_company'],
      },
      {
        label: 'Units',
        path: '/units',
        icon: Truck,
        roles: ['superadmin', 'admin_company'],
      },
      {
        label: 'Drivers',
        path: '/drivers',
        icon: Users,
        roles: ['superadmin', 'admin_company'],
      },
      {
        label: 'Tyres',
        path: '/tyres',
        icon: TyreIcon,
        roles: ['superadmin', 'admin_company'],
      },
      {
        label: 'Replacements',
        path: '/replacements',
        icon: RefreshCw,
        roles: ['superadmin', 'admin_company'],
      },
    ],
  },
  // {
  //   section: 'Reports',
  //   items: [
  //     {
  //       label: 'Replacement History',
  //       path: '/reports/replacements',
  //       icon: History,
  //       roles: ['superadmin', 'admin_company'],
  //     },
  //     {
  //       label: 'Inventory',
  //       path: '/reports/inventory',
  //       icon: Boxes,
  //       roles: ['superadmin', 'admin_company'],
  //     },
  //     {
  //       label: 'Schedule',
  //       path: '/reports/schedule',
  //       icon: CalendarClock,
  //       roles: ['superadmin', 'admin_company'],
  //     },
  //   ],
  // },
  {
    section: 'Configuration',
    items: [
      {
        label: 'Master Data',
        path: '/master',
        icon: Database,
        roles: ['superadmin'],
      },
      {
        label: 'Tyre Position Templates',
        path: '/master/unit-types',
        icon: LayoutGrid,
        roles: ['superadmin'],
      },
      {
        label: 'Users',
        path: '/users',
        icon: UserCog,
        roles: ['superadmin'],
      },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role;

  const filteredNav = navItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!userRole) return false;
        return item.roles.includes(userRole);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const NavContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <TyreIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">TMS</h1>
            <p className="text-xs text-gray-500">Tyre Management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredNav.map((section) => (
          <div key={section.section}>
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => onClose?.()}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        isActive && 'text-primary-600'
                      )}
                    />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Tyre Management System v1.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 bg-white border-r border-gray-200">
        <NavContent />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}