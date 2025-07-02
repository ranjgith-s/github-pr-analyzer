import { useEffect, useState } from 'react';
import { fetchDeveloperMetrics, DeveloperMetrics } from '../utils/services/github';

export function useDeveloperMetrics(token: string, login: string | null) {
  const [data, setData] = useState<DeveloperMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!login) return;
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const metrics = await fetchDeveloperMetrics(token, login!);
        if (!cancel) setData(metrics);
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

  return { data, loading };
}
