import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MetricsPage from '../MetricsPage';
import { AuthContext } from '../../../contexts/AuthContext/AuthContext';

// Mock the hooks we need
jest.mock('../../../hooks/usePullRequestMetrics', () => ({
  usePullRequestMetrics: jest.fn(() => ({
    items: [{ id: '1', title: 'Test PR' }], // Mock some items so MetricsTable renders
    loading: false,
    error: null,
    totalCount: 1,
    rateLimit: null,
  })),
}));

// Mock MetricsTable component to expose received queryParams
jest.mock('../../../components/MetricsTable/MetricsTable', () => {
  return function MockedMetricsTable(props: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return (
      <div
        data-testid="metrics-table"
        data-query-params={JSON.stringify(props.queryParams)}
      />
    );
  };
});

const mockUser = {
  login: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg',
};

const mockAuthValue = {
  token: 'mock-token',
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithProviders = (
  initialEntries: string[] = ['/insights'],
  authValue: any = mockAuthValue // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <MetricsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('MetricsPage URL Parameter Integration (minimal UI)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getQueryElText = (container: ReturnType<typeof render>) => {
    return container.getByLabelText('Current search query').textContent;
  };

  it('uses default query when no URL parameters', () => {
    const utils = renderWithProviders(['/insights']);
    expect(getQueryElText(utils)).toBe('is:pr involves:testuser');

    const table = utils.getByTestId('metrics-table');
    const params = JSON.parse(table.getAttribute('data-query-params') || '{}');
    expect(params).toEqual({
      page: 1,
      sort: 'updated',
      per_page: 20,
      order: 'desc',
    });
  });

  it('uses query from URL parameters', () => {
    const utils = renderWithProviders(['/insights?q=is:pr+author:john']);
    expect(getQueryElText(utils)).toBe('is:pr author:john');
  });

  it('parses all URL parameters correctly', () => {
    const utils = renderWithProviders([
      '/insights?q=is:pr+label:bug&page=3&sort=created&per_page=50&order=asc',
    ]);
    expect(getQueryElText(utils)).toBe('is:pr label:bug');
    const table = utils.getByTestId('metrics-table');
    const params = JSON.parse(table.getAttribute('data-query-params') || '{}');
    expect(params).toEqual({
      page: 3,
      sort: 'created',
      per_page: 50,
      order: 'asc',
    });
  });

  it('handles missing user gracefully (blank default query)', () => {
    const authValueWithoutUser = { ...mockAuthValue, user: null };
    const utils = renderWithProviders(['/insights'], authValueWithoutUser);
    expect(getQueryElText(utils)).toBe('');
  });

  it('decodes URL-encoded parameters', () => {
    const utils = renderWithProviders([
      '/insights?q=is%3Apr+author%3Ajohn+label%3A%22bug+fix%22',
    ]);
    expect(getQueryElText(utils)).toBe('is:pr author:john label:"bug fix"');
  });
});
