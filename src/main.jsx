import React from 'react';
import ReactDOM from 'react-dom/client';
import {ThemeProvider, BaseStyles} from '@primer/react';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        <App />
      </BaseStyles>
    </ThemeProvider>
  </React.StrictMode>
);
