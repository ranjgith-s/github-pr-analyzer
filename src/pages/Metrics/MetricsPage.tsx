import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { parseQueryParams, getDefaultQuery } from '../../utils/queryUtils';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

export default function MetricsPage() {
  useDocumentTitle('Pull request insights');
  useMetaDescription('Metrics and analytics for your pull requests.');

  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Parse current URL parameters
  const queryParams = parseQueryParams(searchParams);

  // Generate effective query (URL param or default)
  const effectiveQuery = queryParams.q || (user ? getDefaultQuery(user) : '');

  return <MetricsTable query={effectiveQuery} queryParams={queryParams} />;
}
