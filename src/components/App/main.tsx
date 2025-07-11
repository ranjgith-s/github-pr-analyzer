import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/system';
import { BrowserRouter } from 'react-router-dom';
import '../../styles/index.css';
import App from './App';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <HeroUIProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HeroUIProvider>
    </BrowserRouter>
  </React.StrictMode>
);
