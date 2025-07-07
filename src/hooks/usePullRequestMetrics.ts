import { useEffect, useState } from 'react';
import { fetchPullRequestMetrics } from '../utils/services/githubService';
import { PRItem } from '../types';

export function usePullRequestMetrics(token: string) {
  const [items, setItems] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchPullRequestMetrics(token);
        if (isMounted) setItems(data);
      } catch (err) {
        if (isMounted) console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return { items, loading };
}
