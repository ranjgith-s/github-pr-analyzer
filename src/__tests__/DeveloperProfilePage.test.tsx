import React from 'react';
import { render, screen } from '@testing-library/react';
import DeveloperProfilePage from '../DeveloperProfilePage';
import * as AuthContext from '../AuthContext';
import * as useDeveloperMetricsHook from '../hooks/useDeveloperMetrics';
import * as useDocumentTitleHook from '../hooks/useDocumentTitle';
import * as useMetaDescriptionHook from '../hooks/useMetaDescription';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../LoadingOverlay', () => (props: any) => <div data-testid="loading-overlay">{props.show && 'Loading...'}</div>);
jest.mock('@heroui/react', () => ({ Card: (props: any) => <div data-testid="card">{props.children}</div> }));
jest.mock('recharts', () => ({
  RadarChart: (props: any) => <div data-testid="radar-chart">{props.children}</div>,
  Radar: () => <div data-testid="radar" />, 
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
}));
jest.mock('../DeveloperMetricCard', () => (props: any) => <div data-testid="metric-card">{props.name}</div>);

describe('DeveloperProfilePage', () => {
  beforeEach(() => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
    });
    jest.spyOn(useDocumentTitleHook, 'useDocumentTitle').mockImplementation(() => {});
    jest.spyOn(useMetaDescriptionHook, 'useMetaDescription').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderWithRouter(username = 'octocat') {
    return render(
      <MemoryRouter initialEntries={[`/developer/${username}`]}>
        <Routes>
          <Route path="/developer/:username" element={<DeveloperProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows loading overlay when loading', () => {
    jest.spyOn(useDeveloperMetricsHook, 'useDeveloperMetrics').mockReturnValue({ data: null, loading: true });
    renderWithRouter();
    expect(screen.getByTestId('loading-overlay')).toHaveTextContent('Loading...');
  });

  it('renders profile and metrics when data is present', () => {
    const data = {
      login: 'octocat',
      name: 'Octo Cat',
      avatar_url: 'avatar',
      html_url: 'url',
      bio: 'bio',
      company: 'company',
      location: 'location',
      followers: 10,
      following: 5,
      public_repos: 3,
      mergeSuccess: 8,
      mergeRate: 0.8,
      cycleEfficiency: 7,
      averageChanges: 1.2,
      sizeEfficiency: 6,
      medianSize: 50,
      leadTimeScore: 5,
      medianLeadTime: 12,
      reviewActivity: 4,
      reviewsCount: 2,
      feedbackScore: 3,
      averageComments: 1.5,
      issueResolution: 2,
      issuesClosed: 1,
    };
    jest.spyOn(useDeveloperMetricsHook, 'useDeveloperMetrics').mockReturnValue({ data, loading: false });
    renderWithRouter();
    expect(screen.getByText('Octo Cat')).toBeInTheDocument();
    expect(screen.getByText('octocat')).toBeInTheDocument();
    expect(screen.getByText('bio')).toBeInTheDocument();
    expect(screen.getByText(/company/)).toBeInTheDocument();
    expect(screen.getByText(/location/)).toBeInTheDocument();
    expect(screen.getByText('Repos: 3')).toBeInTheDocument();
    expect(screen.getByText('Followers: 10')).toBeInTheDocument();
    expect(screen.getByText('Following: 5')).toBeInTheDocument();
    expect(screen.getByText('View on GitHub')).toHaveAttribute('href', 'url');
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('card').length).toBeGreaterThan(1);
  });

  it('renders nothing but overlay when loading and no data', () => {
    jest.spyOn(useDeveloperMetricsHook, 'useDeveloperMetrics').mockReturnValue({ data: null, loading: true });
    const { container } = renderWithRouter();
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    // Only overlay should be visible
    expect(container.querySelectorAll('[data-testid="card"]').length).toBe(0);
  });
});
