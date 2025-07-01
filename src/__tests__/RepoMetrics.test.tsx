import React from 'react';
import { render, screen } from '@testing-library/react';
import RepoMetrics from '../RepoMetrics';
import * as AuthContext from '../AuthContext';
import * as useRepoInsightsHook from '../hooks/useRepoInsights';
import * as useDocumentTitleHook from '../hooks/useDocumentTitle';
import * as useMetaDescriptionHook from '../hooks/useMetaDescription';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../LoadingOverlay', () => (props: any) => <div data-testid="loading-overlay">{props.show && 'Loading...'}</div>);
jest.mock('@heroui/react', () => ({ Card: (props: any) => <div data-testid="card">{props.children}</div> }));

describe('RepoMetrics', () => {
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

  function renderWithRouter(owner = 'octocat', repo = 'hello-world') {
    return render(
      <MemoryRouter initialEntries={[`/repo/${owner}/${repo}`]}>
        <Routes>
          <Route path="/repo/:owner/:repo" element={<RepoMetrics />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows loading overlay when loading', () => {
    jest.spyOn(useRepoInsightsHook, 'useRepoInsights').mockReturnValue({ data: null, loading: true, error: null });
    renderWithRouter();
    expect(screen.getByTestId('loading-overlay')).toHaveTextContent('Loading...');
  });

  it('shows error message when error', () => {
    jest.spyOn(useRepoInsightsHook, 'useRepoInsights').mockReturnValue({ data: null, loading: false, error: 'Something went wrong' });
    renderWithRouter();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('returns null when no data and not loading or error', () => {
    jest.spyOn(useRepoInsightsHook, 'useRepoInsights').mockReturnValue({ data: null, loading: false, error: null });
    const { container } = renderWithRouter();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all metric cards when data is present', () => {
    const data = {
      deploymentFrequency: 5,
      leadTime: 12.34,
      changeFailureRate: 0.25,
      meanTimeToRestore: 3.21,
      openIssues: 10,
      openPullRequests: 4,
      averageMergeTime: 2.5,
      weeklyCommits: [1,2,3,4,5],
      contributorCount: 7,
      communityHealthScore: 8
    };
    jest.spyOn(useRepoInsightsHook, 'useRepoInsights').mockReturnValue({ data, loading: false, error: null });
    renderWithRouter();
    expect(screen.getByText('Deployment Frequency')).toBeInTheDocument();
    expect(screen.getByText('5 pushes')).toBeInTheDocument();
    expect(screen.getByText('Lead Time for Changes')).toBeInTheDocument();
    expect(screen.getByText('12.34 hours')).toBeInTheDocument();
    expect(screen.getByText('Change Failure Rate')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('Mean Time to Restore')).toBeInTheDocument();
    expect(screen.getByText('3.21 hours')).toBeInTheDocument();
    expect(screen.getByText('Open Issue Count')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Open Pull Request Count')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Average PR Merge Time')).toBeInTheDocument();
    expect(screen.getByText('2.50 hours')).toBeInTheDocument();
    expect(screen.getByText('Weekly Commit Activity')).toBeInTheDocument();
    expect(screen.getByText('1, 2, 3, 4, 5')).toBeInTheDocument();
    expect(screen.getByText('Contributor Count')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Community Health Score')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
