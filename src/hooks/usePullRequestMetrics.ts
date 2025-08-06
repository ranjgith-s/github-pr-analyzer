import { useEffect, useState } from 'react';
import { fetchPullRequestMetrics } from '../utils/services/githubService';
import { PRItem } from '../types';

interface UsePullRequestMetricsOptions {
  query?: string;
  page?: number;
  sort?: 'updated' | 'created' | 'comments';
  perPage?: number;
}

export function usePullRequestMetrics(
  token: string | null,
  options?: UsePullRequestMetricsOptions
) {
  const [items, setItems] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchPullRequestMetrics(
          token!,
          options?.query || '',
          {
            page: options?.page,
            sort: options?.sort,
            per_page: options?.perPage,
          }
        );

        if (isMounted) {
          // Handle both legacy array format and new PRSearchResult format
          if (Array.isArray(result)) {
            setItems(result);
          } else {
            setItems(result.items);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token && options?.query) {
      load();
    } else {
      // When conditions are not met, set loading to false
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token, options?.query, options?.page, options?.sort, options?.perPage]);

  return { items, loading, error };
}
