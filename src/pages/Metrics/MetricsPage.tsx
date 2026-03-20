import React from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import MetricsTable from '../../components/MetricsTable/MetricsTable';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import { SummaryMetricsStrip } from '../../components/SummaryMetricsStrip/SummaryMetricsStrip';
import { useMetricsPage } from './useMetricsPage';

export default function MetricsPage() {
  useDocumentTitle('Pull request insights');
  useMetaDescription('Metrics and analytics for your pull requests.');

  const {
    queryContext,
    items,
    loading,
    error,
    totalCount,
    loadingMessages,
    summary,
    uiState,
    updateQueryParams,
    handleQueryChange,
  } = useMetricsPage();

  return (
    <div className="container mx-auto px-4 py-6">
      <QueryDisplay
        query={queryContext.query}
        resultCount={loading ? undefined : totalCount}
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
          <LoadingOverlay show={true} messages={loadingMessages} />
        )}

        {uiState === 'ready' && (
          <MetricsTable
            queryParams={queryContext.params}
            totalCount={totalCount}
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
