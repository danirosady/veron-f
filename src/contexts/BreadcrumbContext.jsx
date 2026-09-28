import { createContext, useContext, useState, useCallback } from 'react';

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [breadcrumbs, setBreadcrumbs] = useState({});

  const setBreadcrumb = useCallback((label, path = null) => {
    // If path is provided, set for that specific path
    // Otherwise, use the current window location path
    const targetPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (targetPath) {
      setBreadcrumbs(prev => ({
        ...prev,
        [targetPath]: label,
      }));
    }
  }, []);

  const getBreadcrumb = useCallback((path) => {
    return breadcrumbs[path] || null;
  }, [breadcrumbs]);

  return (
    <BreadcrumbContext.Provider value={{ setBreadcrumb, getBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
