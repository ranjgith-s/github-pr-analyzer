import React, { useCallback } from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { buildQueryString } from '../../utils/queryUtils';
import { useNavigate } from 'react-router-dom';

export default function MetricsPage() {
  useDocumentTitle('Pull request insights');
  useMetaDescription('Metrics and analytics for your pull requests.');

  const { token } = useAuth();
  const queryContext = useQueryContext();
  const navigate = useNavigate();

  const { items, loading, error, totalCount, rateLimit } =
    usePullRequestMetrics(token!, {
      query: queryContext.query,
      page: queryContext.params.page,
      sort: queryContext.params.sort as 'updated' | 'created' | 'comments',
      perPage: queryContext.params.per_page,
      order: queryContext.params.order as 'asc' | 'desc',
    });

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      const qs = buildQueryString({
        q: newQuery,
        page: 1, // reset page on new query
        sort: queryContext.params.sort,
        per_page: queryContext.params.per_page,
        order: queryContext.params.order,
      });
      navigate(`/insights?${qs}`);
    },
    [
      navigate,
      queryContext.params.sort,
      queryContext.params.per_page,
      queryContext.params.order,
    ]
  );

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
        resultCount={loading ? undefined : (totalCount ?? items?.length)}
        isLoading={loading}
        error={error}
        onQueryChange={handleQueryChange}
        editable={true}
      />

      {rateLimit && !loading && (
        <div className="text-xs text-default-400 mt-2">
          Rate limit: {rateLimit.remaining}/{rateLimit.limit} resets at{' '}
          {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
        </div>
      )}

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
          totalCount={totalCount ?? items.length}
          onPageChange={(page: number) => {
            const qs = buildQueryString({
              q: queryContext.query,
              page,
              sort: queryContext.params.sort,
              per_page: queryContext.params.per_page,
              order: queryContext.params.order,
            });
            navigate(`/insights?${qs}`);
          }}
          onPerPageChange={(perPage: number) => {
            const qs = buildQueryString({
              q: queryContext.query,
              page: 1, // reset page when per-page changes
              sort: queryContext.params.sort,
              per_page: perPage,
              order: queryContext.params.order,
            });
            navigate(`/insights?${qs}`);
          }}
          onSortChange={(sort: string) => {
            const qs = buildQueryString({
              q: queryContext.query,
              page: 1, // reset page on sort change
              sort,
              per_page: queryContext.params.per_page,
              order: queryContext.params.order,
            });
            navigate(`/insights?${qs}`);
          }}
          onOrderChange={(order: 'asc' | 'desc') => {
            const qs = buildQueryString({
              q: queryContext.query,
              page: 1,
              sort: queryContext.params.sort,
              per_page: queryContext.params.per_page,
              order,
            });
            navigate(`/insights?${qs}`);
          }}
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
