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
  })),
}));

// Mock MetricsTable component (no query props needed now)
jest.mock('../../../components/MetricsTable/MetricsTable', () => {
  return function MockedMetricsTable() {
    return <div data-testid="metrics-table" />;
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
  authValue: any = mockAuthValue
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <MetricsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('MetricsPage URL Parameter Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use default query when no URL parameters', () => {
    const { getByTestId } = renderWithProviders(['/insights']);

    expect(getByTestId('query-debug')).toHaveTextContent(
      'is:pr involves:testuser'
    );

    expect(getByTestId('query-params-debug')).toHaveTextContent(
      JSON.stringify({
        page: 1,
        sort: 'updated',
        per_page: 20,
        order: 'desc',
      })
    );
  });

  it('should use query from URL parameters', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+author:john',
    ]);

    expect(getByTestId('query-debug')).toHaveTextContent('is:pr author:john');

    expect(getByTestId('query-params-debug')).toHaveTextContent(
      JSON.stringify({
        page: 1,
        sort: 'updated',
        per_page: 20,
        order: 'desc',
      })
    );
  });

  it('should parse all URL parameters correctly', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+label:bug&page=3&sort=created&per_page=50&order=asc',
    ]);

    expect(getByTestId('query-debug')).toHaveTextContent('is:pr label:bug');

    expect(getByTestId('query-params-debug')).toHaveTextContent(
      JSON.stringify({
        page: 3,
        sort: 'created',
        per_page: 50,
        order: 'asc',
      })
    );
  });

  it('should handle missing user gracefully', () => {
    const authValueWithoutUser = {
      ...mockAuthValue,
      user: null,
    };

    const { getByTestId } = renderWithProviders(
      ['/insights'],
      authValueWithoutUser
    );

    expect(getByTestId('query-debug')).toHaveTextContent('');
  });

  it('should handle URL parameter changes (initial parse)', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+author:alice',
    ]);

    expect(getByTestId('query-debug')).toHaveTextContent('is:pr author:alice');

    expect(getByTestId('query-params-debug')).toHaveTextContent(
      JSON.stringify({
        page: 1,
        sort: 'updated',
        per_page: 20,
        order: 'desc',
      })
    );
  });

  it('should decode URL-encoded parameters', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is%3Apr+author%3Ajohn+label%3A%22bug+fix%22',
    ]);

    expect(getByTestId('query-debug')).toHaveTextContent(
      'is:pr author:john label:"bug fix"'
    );
  });
});
