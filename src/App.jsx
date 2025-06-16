import React, { useState } from 'react';
import Login from './Login';
import MetricsTable from './MetricsTable';

export default function App() {
  const [token, setToken] = useState(null);

  if (!token) {
    return <Login onToken={setToken} />;
  }

  return <MetricsTable token={token} />;
}
