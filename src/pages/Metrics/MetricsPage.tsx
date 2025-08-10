import React, { useCallback, useMemo } from 'react';
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
import { computeSummaryMetrics } from '../../utils/metrics/summary';

function RateLimitBadge({
  rateLimit,
}: {
  rateLimit: { remaining: number; limit: number; reset: number };
}) {
  const pct = rateLimit.limit ? rateLimit.remaining / rateLimit.limit : 0;
  const color =
    pct < 0.1 ? 'text-danger' : pct < 0.3 ? 'text-warning' : 'text-default-500';
  return (
    <div className={`text-xs ${color}`} aria-live="polite">
      API {rateLimit.remaining}/{rateLimit.limit} · resets{' '}
      {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
    </div>
  );
}

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
      keepPreviousData: true,
    });

  const summary = useMemo(() => computeSummaryMetrics(items), [items]);

  const updateQueryParams = useCallback(
    (
      patch: Partial<{
        page: number;
        sort: string;
        per_page: number;
        order: string;
        q: string;
      }>
    ) => {
      const qs = buildQueryString({
        q: patch.q ?? queryContext.query,
        page: patch.page ?? (patch.q ? 1 : queryContext.params.page),
        sort: patch.sort ?? queryContext.params.sort,
        per_page: patch.per_page ?? queryContext.params.per_page,
        order: patch.order ?? queryContext.params.order,
      });
      navigate(`/insights?${qs}`);
    },
    [navigate, queryContext.query, queryContext.params]
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      updateQueryParams({ q: newQuery });
    },
    [updateQueryParams]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Test-only debug elements to assert query + params after refactor */}
      {process.env.NODE_ENV === 'test' && (
        <div style={{ display: 'none' }} data-testid="debug-query-container">
          <div data-testid="query-debug">{queryContext.query}</div>
          {/* stringify only stable primitive params */}
          <div data-testid="query-params-debug">
            {JSON.stringify(queryContext.params)}
          </div>
        </div>
      )}
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

      <div className="flex flex-wrap gap-4 items-end mb-6">
        {summary && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full md:w-auto flex-1"
            aria-label="Pull request metrics summary"
          >
            <SummaryCard label="PRs" value={summary.count} />
            <SummaryCard label="Open" value={summary.open} />
            <SummaryCard label="Merged" value={summary.merged} />
            <SummaryCard
              label="Median Lead"
              value={
                summary.medianLeadTimeH != null
                  ? `${summary.medianLeadTimeH}h`
                  : '—'
              }
            />
            <SummaryCard
              label="Median Review"
              value={
                summary.medianReviewH != null
                  ? `${summary.medianReviewH}h`
                  : '—'
              }
            />
          </div>
        )}
        {rateLimit && !loading && <RateLimitBadge rateLimit={rateLimit} />}
      </div>

      {loading && items.length === 0 && (
        <LoadingOverlay
          show={true}
          messages={['Loading pull request data...']}
        />
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-danger mb-4">Failed to load pull request data</p>
          <p className="text-sm text-default-500">{error}</p>
          <button
            onClick={() =>
              updateQueryParams({ page: 1, q: queryContext.query })
            }
            className="mt-4 text-sm px-3 py-1 rounded bg-default-200 hover:bg-default-300"
          >
            Retry
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <MetricsTable
          queryParams={queryContext.params}
          totalCount={totalCount ?? items.length}
          items={items}
          loading={loading}
          error={error}
          onPageChange={(page: number) => updateQueryParams({ page })}
          onPerPageChange={(perPage: number) =>
            updateQueryParams({ per_page: perPage, page: 1 })
          }
          onSortChange={(sort: string) => updateQueryParams({ sort, page: 1 })}
          onOrderChange={(order: 'asc' | 'desc') =>
            updateQueryParams({ order, page: 1 })
          }
        />
      )}

      {items && items.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-default-500 mb-4">No pull requests found</p>
          <div className="text-sm text-default-400 space-y-2">
            <p>Try adjusting your search query or use one of these examples:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'is:pr is:open author:@me',
                'is:pr review-requested:@me',
                'is:pr is:merged',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQueryChange(q)}
                  className="px-2 py-1 text-xs rounded bg-default-100 hover:bg-default-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div
      className="rounded-md bg-default-100 p-3 flex flex-col min-w-[90px]"
      role="figure"
    >
      <span className="text-xs text-default-500">{label}</span>
      <span
        className="text-lg font-semibold"
        aria-label={label}
        aria-live="polite"
      >
        {value}
      </span>
    </div>
  );
}
