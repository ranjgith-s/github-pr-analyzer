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
      <Box p={token ? 3 : 0}>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={
              token ? <MetricsTable /> : <Navigate to="/login" replace />
            }
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
