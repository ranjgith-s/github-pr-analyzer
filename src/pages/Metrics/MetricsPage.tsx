import React, { useCallback, useMemo } from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
// Removed LoadingOverlay in favor of lightweight skeletons
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { buildQueryString } from '../../utils/queryUtils';
import { useNavigate } from 'react-router-dom';
import { computeSummaryMetrics } from '../../utils/metrics/summary';

// --- New lightweight UI primitives ---
function Skeleton({
  width = 'w-16',
  className = '',
}: {
  width?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-default-200/60 rounded h-4 animate-pulse ${width} ${className}`}
    />
  );
}

// Condensed status bar (rate limit + total count)
function StatusBar({
  total,
  rateLimit,
  loading,
}: {
  total?: number;
  rateLimit?: { remaining: number; limit: number; reset: number } | null;
  loading: boolean;
}) {
  if (!rateLimit && total == null) return null;
  const pct = rateLimit?.limit ? rateLimit.remaining / rateLimit.limit : 0;
  const color =
    pct < 0.1 ? 'text-danger' : pct < 0.3 ? 'text-warning' : 'text-default-500';
  return (
    <div
      className="flex items-center justify-end gap-4 mt-3 text-xs text-default-500"
      aria-live="polite"
    >
      <div>
        {loading ? (
          <Skeleton width="w-10" />
        ) : total != null ? (
          `${total.toLocaleString()} PRs`
        ) : null}
      </div>
      {rateLimit && (
        <div
          className={color}
          title={`Resets at ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}`}
        >
          API {rateLimit.remaining}/{rateLimit.limit}
        </div>
      )}
    </div>
  );
}

// Horizontal metric strip (replaces card grid)
function SummaryMetricsStrip({
  summary,
  loading,
}: {
  summary: ReturnType<typeof computeSummaryMetrics> | null;
  loading: boolean;
}) {
  const metrics: { label: string; value: string | number | null }[] = [
    { label: 'PRs', value: summary?.count ?? null },
    { label: 'Open', value: summary?.open ?? null },
    { label: 'Merged', value: summary?.merged ?? null },
    {
      label: 'Median Lead',
      value:
        summary?.medianLeadTimeH != null
          ? formatHours(summary.medianLeadTimeH)
          : null,
    },
    {
      label: 'Median Review',
      value:
        summary?.medianReviewH != null
          ? formatHours(summary.medianReviewH)
          : null,
    },
  ];
  return (
    <section aria-label="Pull request summary metrics" className="mt-4">
      <div className="flex flex-wrap items-stretch gap-3 bg-default-50 border border-default-200 rounded-md px-4 py-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            role="group"
            aria-label={m.label}
            className="flex flex-col justify-center min-w-[70px]"
          >
            <span className="text-[10px] uppercase tracking-wide text-default-400">
              {m.label}
            </span>
            <span
              className="text-sm font-semibold text-default-700"
              aria-live="polite"
            >
              {loading ? (
                <Skeleton width="w-8" />
              ) : m.value != null ? (
                <>{m.value}</>
              ) : (
                '—'
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatHours(h: number) {
  if (h >= 48) return `${(h / 24).toFixed(1)}d`;
  if (h >= 24) return '1d+';
  return `${h}h`;
}

// Type helper for updating query params
type QueryPatch = Partial<{
  page: number;
  sort: string;
  per_page: number;
  order: string;
  q: string;
}>;

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
  const effectiveTotal = totalCount ?? items?.length ?? 0;

  // Central UI state machine (simplified for readability & lint compliance)
  let uiState: 'loading' | 'error' | 'empty' | 'ready';
  if (loading && items.length === 0) uiState = 'loading';
  else if (error) uiState = 'error';
  else if (!loading && items.length === 0) uiState = 'empty';
  else uiState = 'ready';

  const updateQueryParams = useCallback(
    (patch: QueryPatch) => {
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
    <div className="container mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Pull Request Insights</h1>
      </header>

      <QueryDisplay
        query={queryContext.query}
        resultCount={loading ? undefined : effectiveTotal}
        isLoading={loading}
        error={error}
        onQueryChange={handleQueryChange}
        editable={true}
      />

      <SummaryMetricsStrip summary={summary} loading={loading} />
      <StatusBar
        total={effectiveTotal}
        rateLimit={rateLimit}
        loading={loading}
      />

      <main className="mt-4" aria-live="polite">
        {uiState === 'error' && (
          <div className="flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger">
            <span>Failed to load pull request data: {error}</span>
            <button
              onClick={() =>
                updateQueryParams({ page: 1, q: queryContext.query })
              }
              className="text-xs font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {uiState === 'empty' && (
          <div className="text-center py-10 text-sm text-default-500">
            No pull requests found for this query.
          </div>
        )}

        {uiState === 'loading' && (
          <div className="mt-6 space-y-2" aria-label="Loading results">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-md bg-default-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {uiState === 'ready' && (
          <MetricsTable
            queryParams={queryContext.params}
            totalCount={effectiveTotal}
            items={items}
            loading={loading}
            error={error}
            onPageChange={(page: number) => updateQueryParams({ page })}
            onPerPageChange={(perPage: number) =>
              updateQueryParams({ per_page: perPage, page: 1 })
            }
            onSortChange={(sort: string) =>
              updateQueryParams({ sort, page: 1 })
            }
            onOrderChange={(order: 'asc' | 'desc') =>
              updateQueryParams({ order, page: 1 })
            }
          />
        )}
      </main>
    </div>
  );
}

// Removed old SummaryCard & RateLimitBadge components as functionality replaced by new condensed components
