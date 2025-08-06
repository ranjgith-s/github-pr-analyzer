export interface QueryParams {
  q?: string;
  page?: number;
  sort?: string;
  per_page?: number;
}

export interface User {
  login: string;
}

export function getDefaultQuery(user: User): string {
  return `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
}

export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const q = searchParams.get('q');
  const page = searchParams.get('page');
  const sort = searchParams.get('sort');
  const perPage = searchParams.get('per_page');

  return {
    q: q || undefined,
    page: page ? Number(page) : 1,
    sort: sort || 'updated',
    per_page: perPage ? Number(perPage) : 20,
  };
}

export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.page && params.page > 1)
    searchParams.set('page', params.page.toString());
  if (params.sort && params.sort !== 'updated')
    searchParams.set('sort', params.sort);
  if (params.per_page && params.per_page !== 20)
    searchParams.set('per_page', params.per_page.toString());

  return searchParams.toString();
}
