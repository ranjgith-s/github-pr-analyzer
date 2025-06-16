import React, { useState } from 'react';

export default function Login({ onToken }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      onToken(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem', textAlign: 'center' }}>
      <h1>GitHub PR Analyzer</h1>
      <p>Enter a personal access token to continue:</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="GitHub token"
      />
      <button type="submit" style={{ marginLeft: '0.5rem' }}>
        Sign in
      </button>
    </form>
  );
}
