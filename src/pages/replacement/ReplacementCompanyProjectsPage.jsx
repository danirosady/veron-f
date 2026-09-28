import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReplacementProjectPage from './ReplacementProjectPage';
import { companiesAPI } from '@/api/companies';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function ReplacementCompanyProjectsPage() {
  const { companyId } = useParams();
  const { setBreadcrumb } = useBreadcrumb();

  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesAPI.get(companyId),
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (companyData) {
      const company = companyData.data?.data || companyData.data;
      if (company?.name) {
        setBreadcrumb(company.name, `/replacement/companies/${companyId}`);
      }
    }
  }, [companyData, companyId, setBreadcrumb]);

  return <ReplacementProjectPage companyId={parseInt(companyId)} showBack />;
}
