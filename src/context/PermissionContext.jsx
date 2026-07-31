import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const PermissionContext = createContext(null);

const RESOURCE_ROLES = {
  companies: ['superadmin'],
  projects: ['superadmin', 'admin_company'],
  units: ['superadmin', 'admin_company'],
  drivers: ['superadmin', 'admin_company'],
  tyres: ['superadmin', 'admin_company'],
  replacements: ['superadmin', 'admin_company'],
  reports: ['superadmin', 'admin_company'],
  master: ['superadmin'],
  users: ['superadmin'],
};

export function PermissionProvider({ children }) {
  const { user } = useAuth();

  const isSuperadmin = useCallback(() => {
    return user?.role === 'superadmin';
  }, [user?.role]);

  const isAdminCompany = useCallback(() => {
    return user?.role === 'admin_company';
  }, [user?.role]);

  const isCompanyAdmin = useCallback(() => {
    return user?.role === 'admin_company';
  }, [user?.role]);

  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user?.role]
  );

  const canAccess = useCallback(
    (resource) => {
      const allowedRoles = RESOURCE_ROLES[resource];
      if (!allowedRoles) return false;
      return allowedRoles.includes(user?.role);
    },
    [user?.role]
  );

  const canAccessCompany = useCallback(
    (companyId) => {
      if (!user) return false;
      if (user.role === 'superadmin') return true;
      if (user.role === 'admin_company') {
        return user.company_id === companyId || user.company_id === parseInt(companyId, 10);
      }
      return false;
    },
    [user]
  );

  const value = {
    isSuperadmin,
    isAdminCompany,
    isCompanyAdmin,
    hasRole,
    canAccess,
    canAccessCompany,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
