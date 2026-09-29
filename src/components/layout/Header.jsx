import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { LanguageToggle } from '@/components/ui/LanguageSwitcher';
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
  const isConfigurationPath = matchesBase('/master') || matchesBase('/unit-types') || matchesBase('/users') || matchesBase('/settings');

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

  // Build sub-path for each segment - use raw lowercase paths for matching
  const rawPathSegments = location.pathname.split('/').filter(Boolean);
  const subPaths = rawPathSegments.map((_, idx) =>
    '/' + rawPathSegments.slice(0, idx + 1).join('/')
  );

  // Helper to get label from context or fallback to default
  const getLabel = (subPath, fallbackLabel) => {
    return getBreadcrumb(subPath) || fallbackLabel;
  };

  const breadcrumbs = isReplacementPath
    ? [
        { label: 'Operations', path: '/ops' },
        { label: 'Replacement', path: '/replacement' },
        ...pathSegments.slice(1).map((seg, idx) => ({
          label: getLabel(subPaths[idx + 1], seg.replace(/-/g, ' ')),
          path: subPaths[idx + 1],
        })),
      ]
    : isManagementPath
    ? [
        { label: 'Management', path: '/management' },
        ...rawPathSegments
          .map((seg, idx) => {
            const fallback = seg.replace(/-/g, ' ');
            const isIdSegment = /^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(seg);
            if (isIdSegment) return null;
            const label = getManagementLabel(subPaths[idx]) || fallback;
            return {
              label: getLabel(subPaths[idx], label),
              path: subPaths[idx],
            };
          })
          .filter(Boolean),
      ]
    : isConfigurationPath
    ? [
        { label: 'Configuration', path: '/config' },
        { label: rawPathSegments[0] === 'master' ? 'Master Data' : rawPathSegments[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), path: '/' + rawPathSegments[0] },
        ...rawPathSegments.slice(1).map((seg, idx) => {
          const isIdSegment = /^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(seg);
          if (isIdSegment) return null;
          return {
            label: getLabel(subPaths[idx + 1], seg.replace(/-/g, ' ')),
            path: subPaths[idx + 1],
          };
        }).filter(Boolean),
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
        <div className="flex items-center gap-1">
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <LanguageToggle className="text-lg" />
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
        </div>
      </div>

        <div className="relative" ref={dropdownRef}>
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
    </header>
  );
}
