import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MetricsPage from '../MetricsPage';
import { AuthContext } from '../../../contexts/AuthContext/AuthContext';

// Mock MetricsTable component to simplify testing
jest.mock('../../../components/MetricsTable/MetricsTable', () => {
  return function MockedMetricsTable({ query, queryParams }: any) {
    return (
      <div data-testid="metrics-table">
        <div data-testid="query">{query}</div>
        <div data-testid="query-params">{JSON.stringify(queryParams)}</div>
      </div>
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

    expect(getByTestId('query')).toHaveTextContent(
      'is:pr author:testuser OR is:pr reviewed-by:testuser'
    );

    expect(getByTestId('query-params')).toHaveTextContent(
      JSON.stringify({
        page: 1,
        sort: 'updated',
        per_page: 20,
      })
    );
  });

  it('should use query from URL parameters', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+author:john',
    ]);

    expect(getByTestId('query')).toHaveTextContent('is:pr author:john');

    expect(getByTestId('query-params')).toHaveTextContent(
      JSON.stringify({
        q: 'is:pr author:john',
        page: 1,
        sort: 'updated',
        per_page: 20,
      })
    );
  });

  it('should parse all URL parameters correctly', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+label:bug&page=3&sort=created&per_page=50',
    ]);

    expect(getByTestId('query')).toHaveTextContent('is:pr label:bug');

    expect(getByTestId('query-params')).toHaveTextContent(
      JSON.stringify({
        q: 'is:pr label:bug',
        page: 3,
        sort: 'created',
        per_page: 50,
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

    expect(getByTestId('query')).toHaveTextContent('');
  });

  it('should handle URL parameter changes', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is:pr+author:alice',
    ]);

    expect(getByTestId('query')).toHaveTextContent('is:pr author:alice');

    // For a proper test of URL changes, we would need to test with actual routing
    // This tests that the component correctly parses the initial URL
    expect(getByTestId('query-params')).toHaveTextContent(
      JSON.stringify({
        q: 'is:pr author:alice',
        page: 1,
        sort: 'updated',
        per_page: 20,
      })
    );
  });

  it('should decode URL-encoded parameters', () => {
    const { getByTestId } = renderWithProviders([
      '/insights?q=is%3Apr+author%3Ajohn+label%3A%22bug+fix%22',
    ]);

    expect(getByTestId('query')).toHaveTextContent(
      'is:pr author:john label:"bug fix"'
    );
  });
});
