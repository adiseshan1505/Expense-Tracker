import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MetaProvider } from './context/MetaContext';
import { ToastProvider } from './context/ToastContext';
import './styles/index.css';

// After a new deploy, an already-open tab may request code chunks that no longer exist; reload once to get the new build.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'et_reloaded_at';
  try {
    const last = Number(sessionStorage.getItem(key));
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <MetaProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MetaProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
