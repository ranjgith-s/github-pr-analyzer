import React from 'react';
import { Box } from '@primer/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './Login';
import MetricsPage from './MetricsPage';
import Home from './Home';
import Header from './Header';
import PullRequestPage from './PullRequest';
import { useAuth } from './AuthContext';

export default function App() {
  const { token } = useAuth();
  const location = useLocation();

  let breadcrumb: string | undefined;
  if (
    location.pathname.startsWith('/insights') ||
    location.pathname.startsWith('/pr')
  ) {
    breadcrumb = 'Pull request insights';
  }

  return (
    <Box bg="canvas.default" minHeight="100vh">
      {token && <Header breadcrumb={breadcrumb} />}
      <Box p={3}>
        <Routes>
          <Route path="/" element={!token ? <Login /> : <Home />} />
          <Route
            path="/insights"
            element={token ? <MetricsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/pr/:owner/:repo/:number"
            element={token ? <PullRequestPage /> : <Navigate to="/" replace />}
          />
        </Routes>
      </Box>
    </Box>
  );
}
