import React, { useState } from 'react';
import {Box} from '@primer/react';
import {Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login';
import MetricsTable from './MetricsTable';
import Header from './Header';
import TimelinePage from './Timeline.jsx';

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
            path="/timeline/:owner/:repo/:number"
            element={token ? <TimelinePage token={token} /> : <Navigate to="/" replace />}
          />
        </Routes>
      </Box>
    </Box>
  );
}
