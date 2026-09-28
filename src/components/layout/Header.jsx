import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User, LogOut, Settings, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { getBreadcrumb } = useBreadcrumb();

  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  // Operations flow - only for replacement sub-routes (NOT /replacements which is Management)
  const isReplacementPath = location.pathname === '/replacement' || 
    (location.pathname.startsWith('/replacement/') && !location.pathname.startsWith('/replacements'));

  // Check if path matches a base management route or its sub-routes
  const matchesBase = (base) =>
    location.pathname === base || location.pathname.startsWith(base + '/');

  // Management routes (Dashboard + core business entities)
  const isManagementPath = matchesBase('/dashboard') || matchesBase('/companies') ||
    matchesBase('/projects') || matchesBase('/units') || matchesBase('/drivers') ||
    matchesBase('/tyres') || matchesBase('/replacements');

  // Configuration routes (Master data, Users, Settings)
  const isConfigurationPath = matchesBase('/master') || matchesBase('/users') || matchesBase('/settings');

  const isReportsPath = location.pathname.startsWith('/reports');

  // Get management label for a path
  const getManagementLabel = (path) => {
    if (path === '/dashboard' || path === '/dashboard/') return 'Dashboard';
    if (path === '/replacements' || path.startsWith('/replacements/')) return 'Replacements History';
    if (path === '/companies' || path.startsWith('/companies/')) return 'Companies';
    if (path === '/projects' || path.startsWith('/projects/')) return 'Projects';
    if (path === '/units' || path.startsWith('/units/')) return 'Units';
    if (path === '/drivers' || path.startsWith('/drivers/')) return 'Drivers';
    if (path === '/tyres' || path.startsWith('/tyres/')) return 'Tyres';
    return null;
  };

  // Get Configuration label for a path
  const getConfigurationLabel = (path) => {
    if (path === '/master' || path.startsWith('/master')) return 'Master Data';
    if (path === '/users' || path.startsWith('/users')) return 'Users';
    if (path === '/settings') return 'Settings';
    return null;
  };

  // Build sub-path for each segment - use raw lowercase paths for matching
  const rawPathSegments = location.pathname.split('/').filter(Boolean);
  const subPaths = rawPathSegments.map((_, idx) =>
    '/' + rawPathSegments.slice(0, idx + 1).join('/')
  );

  // Build display segments (capitalized for labels)
  const displaySegments = pathSegments.map((seg) => seg.replace(/-/g, ' '));

  // Helper to get label from context or fallback to default
  const getLabel = (subPath, fallbackLabel) => {
    const override = getBreadcrumb(subPath);
    return override || fallbackLabel;
  };

  const breadcrumbs = isReplacementPath
    ? [
        { label: 'Operations', path: '/replacement' },
        ...pathSegments.map((seg, idx) => ({
          label: getLabel(subPaths[idx], seg.replace(/-/g, ' ')),
          path: subPaths[idx],
        })),
      ]
    : isManagementPath
    ? [
        { label: 'Management', path: '/management' },
        ...rawPathSegments.map((seg, idx) => ({
          label: getLabel(subPaths[idx], getManagementLabel(subPaths[idx]) || seg.replace(/-/g, ' ')),
          path: subPaths[idx],
        })),
      ]
    : isConfigurationPath
    ? [
        { label: 'Configuration', path: '/master' },
        ...rawPathSegments.map((seg, idx) => ({
          label: getLabel(subPaths[idx], getConfigurationLabel(subPaths[idx]) || seg.replace(/-/g, ' ')),
          path: subPaths[idx],
        })),
      ]
    : isReportsPath
    ? [
        { label: 'Reports', path: '/reports' },
        ...rawPathSegments.slice(1).map((seg, idx) => ({
          label: getLabel(subPaths[idx + 1], seg.replace(/-/g, ' ')),
          path: subPaths[idx + 1],
        })),
      ]
    : [
        // { label: 'Dashboard', path: '/dashboard' },
      ];

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav key={location.pathname} className="hidden sm:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && (
                  <span className="text-gray-400">/</span>
                )}
                <span
                  className={cn(
                    idx === breadcrumbs.length - 1
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                  )}
                  onClick={() => idx < breadcrumbs.length - 1 && navigate(crumb.path)}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-3 mr-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <Globe className="w-4 h-4 text-gray-500" />
            <LanguageSwitcher />
          </div>
          {/* Mobile language switcher */}
          <div className="sm:hidden">
            <LanguageSwitcher variant="buttons" className="text-xs" />
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || ''}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                {t('menu.profile')}
              </button>

              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                {t('menu.settings')}
              </button>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  {t('menu.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
