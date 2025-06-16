import React, { useState } from 'react';
import {Box} from '@primer/react';
import {Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login';
import MetricsTable from './MetricsTable';
import Header from './Header';
import PullRequestPage from './PullRequest.jsx';

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <Box bg="canvas.default" minHeight="100vh">
      {token && <Header token={token} onLogout={() => setToken(null)} />}
      <Box p={3}>
        <Routes>
          <Route
            path="/"
            element={!token ? <Login onToken={setToken} /> : <MetricsTable token={token} />}
          />
          <Route
            path="/pr/:owner/:repo/:number"
            element={token ? <PullRequestPage token={token} /> : <Navigate to="/" replace />}
          />
        </Routes>
      </Box>
    </Box>
  );
}
