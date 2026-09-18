import React from 'react';
import { useParams } from 'react-router-dom';
import ReplacementProjectPage from './ReplacementProjectPage';

export default function ReplacementCompanyProjectsPage() {
  const { companyId } = useParams();
  return <ReplacementProjectPage companyId={parseInt(companyId)} showBack />;
}
