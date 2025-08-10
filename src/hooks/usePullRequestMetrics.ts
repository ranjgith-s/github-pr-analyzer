import { useEffect, useRef, useState } from 'react';
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
  /**
   * When true, retains previously fetched data while loading next request (improves UX by avoiding flashes)
   */
  keepPreviousData?: boolean;
  /**
   * Changing this value forces a refetch even if other params unchanged
   */
  reloadToken?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  const latestRequestId = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const requestId = ++latestRequestId.current;

    async function load() {
      try {
        if (!options?.keepPreviousData) {
          setLoading(true);
        } else {
          setLoading(true);
        }
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

        if (isMounted && requestId === latestRequestId.current) {
          if (Array.isArray(result)) {
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
        if (isMounted && requestId === latestRequestId.current) {
          if (process.env.NODE_ENV !== 'test') {
            console.error(err);
          }
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted && requestId === latestRequestId.current) {
          setLoading(false);
          if (token) {
            getRateLimit(token)
              .then(
                (
                  rl: { remaining: number; limit: number; reset: number } | null
                ) => {
                  if (isMounted && requestId === latestRequestId.current)
                    setRateLimit(rl);
                }
              )
              .catch(() => {});
          }
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
    options?.keepPreviousData,
    options?.reloadToken,
  ]);

  return { items, totalCount, incomplete, loading, error, rateLimit };
}
