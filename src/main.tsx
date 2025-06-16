import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, BaseStyles } from '@primer/react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider colorMode="auto">
        <BaseStyles>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BaseStyles>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
