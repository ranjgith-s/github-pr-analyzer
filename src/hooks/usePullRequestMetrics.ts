import { useEffect, useState } from 'react';
import { fetchPullRequestMetrics } from '../utils/services/githubService';
import { PRItem } from '../types';

interface UsePullRequestMetricsOptions {
  query: string;
  page?: number;
  sort?: 'updated' | 'created' | 'popularity';
  perPage?: number;
}

export function usePullRequestMetrics(
  token: string,
  options: UsePullRequestMetricsOptions
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

        const data = await fetchPullRequestMetrics(token, options.query, {
          page: options.page,
          sort: options.sort,
          per_page: options.perPage,
        });

        if (isMounted) setItems(data);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token && options.query) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [token, options.query, options.page, options.sort, options.perPage]);

  return { items, loading, error };
}
