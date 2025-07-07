import { useEffect, useState } from 'react';
import { fetchRepoInsights } from '../utils/services/githubService';
import { RepoInsights } from 'src/types';

export function useRepoInsights(
  token: string,
  owner: string | null,
  repo: string | null
) {
  const [data, setData] = useState<RepoInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo) return;
    let cancel = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchRepoInsights(token, owner!, repo!);
        if (!cancel) setData(res);
      } catch {
        if (!cancel) setError('Failed to load data');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [token, owner, repo]);

  return { data, loading, error };
}
