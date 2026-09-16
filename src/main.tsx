import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './styles/themes.css';
import './styles/animations.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);