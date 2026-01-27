import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'nprogress/nprogress.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker
registerSW({ immediate: true });

import App from './App.jsx';
import { ToastProvider } from './contexts/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
