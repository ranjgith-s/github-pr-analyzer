import React from 'react';
import { Box } from '@heroui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './Login';
import MetricsPage from './MetricsPage';
import Home from './Home';
import Header from './Header';
import PullRequestPage from './PullRequest';
import DeveloperMetricsPage from './DeveloperMetricsPage';
import RepoInsightsPage from './RepoInsightsPage';
import { useAuth } from './AuthContext';

export default function App() {
  const { token } = useAuth();
  const location = useLocation();

  let breadcrumb: { label: string; to: string } | undefined;
  if (
    location.pathname.startsWith('/insights') ||
    location.pathname.startsWith('/pr')
  ) {
    breadcrumb = { label: 'Pull request insights', to: '/insights' };
  } else if (location.pathname.startsWith('/developer')) {
    breadcrumb = { label: 'Developer insights', to: '/developer' };
  } else if (location.pathname.startsWith('/repo')) {
    breadcrumb = { label: 'Repo insights', to: '/repo' };
  }

  return (
    <Box bg="canvas.default" minHeight="100vh">
      {token && <Header breadcrumb={breadcrumb} />}
      <Box p={token ? 3 : 0}>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={token ? <Home /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/insights"
            element={token ? <MetricsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/developer"
            element={
              token ? <DeveloperMetricsPage /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/repo"
            element={token ? <RepoInsightsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/pr/:owner/:repo/:number"
            element={
              token ? <PullRequestPage /> : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
