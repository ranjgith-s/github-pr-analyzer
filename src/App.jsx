import React, { useState } from 'react';
import {Box} from '@primer/react';
import Login from './Login';
import MetricsTable from './MetricsTable';

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <Box bg="canvas.default" minHeight="100vh" p={3}>
      {!token ? <Login onToken={setToken} /> : <MetricsTable token={token} />}
    </Box>
  );
}
