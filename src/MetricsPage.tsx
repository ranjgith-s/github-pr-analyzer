import React from 'react';
import Header from './Header';
import MetricsTable from './MetricsTable';

export default function MetricsPage() {
  return (
    <>
      <Header breadcrumb="Pull request insights" />
      <MetricsTable />
    </>
  );
}
