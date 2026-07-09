import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for robust offline capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[Timerra] Service Worker registered successfully!', reg.scope))
      .catch(err => console.error('[Timerra] Service Worker registration failed:', err));
  });
} else if ('serviceWorker' in navigator) {
  // In dev mode, we can register it or print confirmation
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[Timerra Dev] Service Worker registered successfully!', reg.scope))
      .catch(err => console.error('[Timerra Dev] Service Worker registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

