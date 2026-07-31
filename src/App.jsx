import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';
import CompanyListPage from '@/pages/company/CompanyListPage';
import CompanyFormPage from '@/pages/company/CompanyFormPage';
import ProjectListPage from '@/pages/project/ProjectListPage';
import ProjectFormPage from '@/pages/project/ProjectFormPage';
import UnitListPage from '@/pages/unit/UnitListPage';
import UnitDetailPage from '@/pages/unit/UnitDetailPage';
import UnitFormPage from '@/pages/unit/UnitFormPage';
import UnitTyresPage from '@/pages/unit/UnitTyresPage';
import DriverListPage from '@/pages/driver/DriverListPage';
import DriverFormPage from '@/pages/driver/DriverFormPage';
import TyreListPage from '@/pages/tyre/TyreListPage';
import TyreDetailPage from '@/pages/tyre/TyreDetailPage';
import TyreFormPage from '@/pages/tyre/TyreFormPage';
import ReplacementListPage from '@/pages/replacement/ReplacementListPage';
import ReplacementFormPage from '@/pages/replacement/ReplacementFormPage';
import ReplacementReportPage from '@/pages/report/ReplacementReportPage';
import InventoryReportPage from '@/pages/report/InventoryReportPage';
import ScheduleReportPage from '@/pages/report/ScheduleReportPage';
import MasterDataPage from '@/pages/master/MasterDataPage';
import UserListPage from '@/pages/user/UserListPage';
import UserFormPage from '@/pages/user/UserFormPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="companies" element={<CompanyListPage />} />
        <Route path="companies/new" element={<CompanyFormPage />} />
        <Route path="companies/:id/edit" element={<CompanyFormPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
        <Route path="units" element={<UnitListPage />} />
        <Route path="units/new" element={<UnitFormPage />} />
        <Route path="units/:id" element={<UnitDetailPage />} />
        <Route path="units/:id/edit" element={<UnitFormPage />} />
        <Route path="units/:id/tyres" element={<UnitTyresPage />} />
        <Route path="drivers" element={<DriverListPage />} />
        <Route path="drivers/new" element={<DriverFormPage />} />
        <Route path="drivers/:id/edit" element={<DriverFormPage />} />
        <Route path="tyres" element={<TyreListPage />} />
        <Route path="tyres/new" element={<TyreFormPage />} />
        <Route path="tyres/:id" element={<TyreDetailPage />} />
        <Route path="tyres/:id/edit" element={<TyreFormPage />} />
        <Route path="replacements" element={<ReplacementListPage />} />
        <Route path="replacements/new" element={<ReplacementFormPage />} />
        <Route path="replacements/:id/edit" element={<ReplacementFormPage />} />
        <Route path="reports/replacements" element={<ReplacementReportPage />} />
        <Route path="reports/inventory" element={<InventoryReportPage />} />
        <Route path="reports/schedule" element={<ScheduleReportPage />} />
        <Route path="master" element={<MasterDataPage />} />
        <Route path="users" element={<UserListPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
