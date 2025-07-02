import React from 'react';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';

export default function MetricsPage() {
  useDocumentTitle('Pull request insights');
  useMetaDescription('Metrics and analytics for your pull requests.');
  return <MetricsTable />;
}
