import React from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';

export default function MetricsPage() {
  useDocumentTitle('Pull request insights');
  useMetaDescription('Metrics and analytics for your pull requests.');

  const { token } = useAuth();
  const queryContext = useQueryContext();

  const { items, loading, error } = usePullRequestMetrics(token!, {
    query: queryContext.query,
    page: queryContext.params.page,
    sort: queryContext.params.sort as 'updated' | 'created' | 'comments',
    perPage: queryContext.params.per_page,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pull Request Insights</h1>
        <p className="text-default-600">
          Analyze pull request metrics and performance data.
        </p>
      </div>

      <QueryDisplay
        query={queryContext.query}
        resultCount={loading ? undefined : items?.length}
        isLoading={loading}
        error={error}
      />

      {loading && (
        <LoadingOverlay
          show={true}
          messages={['Loading pull request data...']}
        />
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-danger mb-4">Failed to load pull request data</p>
          <p className="text-sm text-default-500">{error}</p>
        </div>
      )}

      {items && items.length > 0 && (
        <MetricsTable
          query={queryContext.query}
          queryParams={queryContext.params}
        />
      )}

      {items && items.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-default-500 mb-4">No pull requests found</p>
          <p className="text-sm text-default-400">
            Try adjusting your search query to find relevant results.
          </p>
        </div>
      )}
    </div>
  );
}
