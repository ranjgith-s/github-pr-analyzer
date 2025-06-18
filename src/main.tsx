import React from 'react';
import ReactDOM from 'react-dom/client';
import { BaseStyles } from '@primer/react';
import { ThemeModeProvider } from './ThemeModeContext';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <BaseStyles>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BaseStyles>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
