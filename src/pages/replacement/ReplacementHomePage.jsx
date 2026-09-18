import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ReplacementCompanyPage from './ReplacementCompanyPage';
import ReplacementProjectPage from './ReplacementProjectPage';

export default function ReplacementHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'superadmin') {
    return <ReplacementCompanyPage />;
  }

  return <ReplacementProjectPage companyId={user.company_id} />;
}
