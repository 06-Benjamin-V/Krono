import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './styles/themes.css';
import './styles/animations.css';
import './styles/global.css';
import './styles/workspace.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
);
