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

// Horizontal metric strip (replaces card grid)
function SummaryMetricsStrip({
  summary,
  loading,
}: {
  summary: ReturnType<typeof computeSummaryMetrics> | null;
  loading: boolean;
}) {
  type Metric = {
    key: string;
    label: string;
    value: string | number | null;
    icon: React.ReactNode;
  };

  const IconPR = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <path d="M9 6h6a3 3 0 0 1 3 3v8" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v9" />
    </svg>
  );
  const IconOpen = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-success"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h14" />
      <path d="M10 5l7 7-7 7" />
    </svg>
  );
  const IconMerged = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7v10" />
      <path d="M17 7v4a4 4 0 0 1-4 4H7" />
      <circle cx="7" cy="5" r="2" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="17" cy="5" r="2" />
    </svg>
  );
  const IconClock = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );

  const metrics: Metric[] = [
    { key: 'prs', label: 'PRs', value: summary?.count ?? null, icon: IconPR },
    {
      key: 'open',
      label: 'Open',
      value: summary?.open ?? null,
      icon: IconOpen,
    },
    {
      key: 'merged',
      label: 'Merged',
      value: summary?.merged ?? null,
      icon: IconMerged,
    },
    {
      key: 'lead',
      label: 'Median Lead',
      value:
        summary?.medianLeadTimeH != null
          ? formatHours(summary.medianLeadTimeH)
          : null,
      icon: IconClock,
    },
    {
      key: 'review',
      label: 'Median Review',
      value:
        summary?.medianReviewH != null
          ? formatHours(summary.medianReviewH)
          : null,
      icon: IconClock,
    },
  ];

  return (
    <section aria-label="Pull request summary metrics" className="mt-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-default-50/70 border border-default-200 px-3 py-2 md:px-4 md:py-3 shadow-sm backdrop-blur-sm justify-around">
        {metrics.map((m, idx) => (
          <div key={m.key} className="flex items-center">
            <div
              role="group"
              aria-label={m.label}
              className="flex items-center gap-2 md:gap-3 pr-2 md:pr-3 min-w-[84px]"
            >
              <span className="shrink-0" aria-hidden="true">
                {m.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-default-400">
                  {loading ? <Skeleton width="w-10" /> : m.label}
                </span>
                <span
                  className="text-sm md:text-base font-semibold text-default-700 tabular-nums"
                  aria-live="polite"
                >
                  {loading ? (
                    <Skeleton width="w-12" />
                  ) : m.value != null ? (
                    <>{m.value}</>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
            {idx < metrics.length - 1 && (
              <div
                className="hidden sm:block w-px h-7 bg-default-200/80 mr-2 md:mr-3 rounded"
                aria-hidden="true"
              />
            )}
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

  const { items, loading, error, totalCount } = usePullRequestMetrics(token!, {
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
