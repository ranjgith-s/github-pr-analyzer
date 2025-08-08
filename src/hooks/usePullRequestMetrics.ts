import { useEffect, useState } from 'react';
import {
  fetchPullRequestMetrics,
  getRateLimit,
} from '../utils/services/githubService';
import { PRItem } from '../types';

interface UsePullRequestMetricsOptions {
  query?: string;
  page?: number;
  sort?: 'updated' | 'created' | 'comments';
  perPage?: number;
  order?: 'asc' | 'desc';
}

export interface UsePullRequestMetricsReturn {
  items: PRItem[];
  totalCount: number | null;
  incomplete: boolean;
  loading: boolean;
  error: string | null;
  rateLimit?: { remaining: number; limit: number; reset: number } | null;
}

export function usePullRequestMetrics(
  token: string | null,
  options?: UsePullRequestMetricsOptions
): UsePullRequestMetricsReturn {
  const [items, setItems] = useState<PRItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [incomplete, setIncomplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{
    remaining: number;
    limit: number;
    reset: number;
  } | null>(null);

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
            order: options?.order,
          }
        );

        if (isMounted) {
          if (Array.isArray(result)) {
            // Legacy array format
            setItems(result);
            setTotalCount(result.length);
            setIncomplete(false);
          } else {
            setItems(result.items);
            setTotalCount(result.total_count);
            setIncomplete(result.incomplete_results);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
        // Fetch rate limit info (non-blocking)
        if (token) {
          getRateLimit(token)
            .then(
              (
                rl: { remaining: number; limit: number; reset: number } | null
              ) => {
                if (isMounted) setRateLimit(rl);
              }
            )
            .catch(() => {});
        }
      }
    }

    if (token && options?.query) {
      load();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [
    token,
    options?.query,
    options?.page,
    options?.sort,
    options?.perPage,
    options?.order,
  ]);

  return { items, totalCount, incomplete, loading, error, rateLimit };
}
