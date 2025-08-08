import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext/AuthContext';
import { parseQueryParams, getDefaultQuery } from '../utils/queryUtils';

export interface QueryContext {
  query: string;
  isDefaultQuery: boolean;
  params: {
    page: number;
    sort: string;
    per_page: number;
    order: string;
  };
  source: 'url' | 'default';
}

export function useQueryContext(): QueryContext {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  return useMemo(() => {
    const urlParams = parseQueryParams(searchParams);
    const defaultQuery = user ? getDefaultQuery(user) : '';

    const query = urlParams.q || defaultQuery;
    const isDefaultQuery = !urlParams.q;

    return {
      query,
      isDefaultQuery,
      params: {
        page: urlParams.page || 1,
        sort: urlParams.sort || 'updated',
        per_page: urlParams.per_page || 20,
        order: urlParams.order || 'desc',
      },
      source: isDefaultQuery ? 'default' : 'url',
    };
  }, [searchParams, user]);
}
