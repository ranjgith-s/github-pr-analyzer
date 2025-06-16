import React from 'react';
import { Box } from '@primer/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import MetricsTable from './MetricsTable';
import Header from './Header';
import PullRequestPage from './PullRequest';
import { useAuth } from './AuthContext';

export default function App() {
  const { token } = useAuth();

  return (
    <Box bg="canvas.default" minHeight="100vh">
      {token && <Header />}
      <Box p={3}>
        <Routes>
          <Route path="/" element={!token ? <Login /> : <MetricsTable />} />
          <Route
            path="/pr/:owner/:repo/:number"
            element={token ? <PullRequestPage /> : <Navigate to="/" replace />}
          />
        </Routes>
      </Box>
    </Box>
  );
}
