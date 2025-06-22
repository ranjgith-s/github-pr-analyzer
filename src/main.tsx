import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/system';
import { ThemeModeProvider } from './ThemeModeContext';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <HeroUIProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HeroUIProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
