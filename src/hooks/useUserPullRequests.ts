import { useEffect, useState } from 'react';
import { fetchUserPullRequests, DeveloperPR } from '../services/github';

export function useUserPullRequests(token: string, login: string | null) {
  const [items, setItems] = useState<DeveloperPR[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!login) return;
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const prs = await fetchUserPullRequests(token, login);
        if (!cancel) setItems(prs);
      } catch (err) {
        if (!cancel) console.error(err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [token, login]);

  return { items, loading };
}
