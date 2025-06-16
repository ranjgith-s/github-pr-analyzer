import React, { useState } from 'react';
import {Box} from '@primer/react';
import Login from './Login';
import MetricsTable from './MetricsTable';
import Header from './Header';

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <Box bg="canvas.default" minHeight="100vh">
      {token && (
        <Header token={token} onLogout={() => setToken(null)} />
      )}
      <Box p={3}>
        {!token ? <Login onToken={setToken} /> : <MetricsTable token={token} />}
      </Box>
    </Box>
  );
}
