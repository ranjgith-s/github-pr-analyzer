import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { computeSummaryMetrics } from '../../utils/metrics/summary';
import { buildQueryString } from '../../utils/queryUtils';

export type QueryPatch = Partial<{
  page: number;
  sort: string;
  per_page: number;
  order: string;
  q: string;
}>;

export function useMetricsPage() {
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

  const loadingMessages = useMemo(
    () => [
      'Loading pull requests...',
      'Crunching numbers...',
      'Preparing table...',
    ],
    []
  );

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

  return {
    queryContext,
    items,
    loading,
    error,
    totalCount: effectiveTotal,
    loadingMessages,
    summary,
    uiState,
    updateQueryParams,
    handleQueryChange,
  };
}
