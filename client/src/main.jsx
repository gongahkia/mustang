import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';
import { purgeSession } from './crypto/zeroizeUtils';

if (!window.crypto || !window.crypto.subtle) {
  document.getElementById('root').innerHTML = `
    <div class="crypto-warning">
      Your browser doesn't support Web Crypto API. MUSTANG requires modern browser security features.
    </div>
  `;
  throw new Error('Insecure browser environment');
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (event.error.message.includes('crypto')) {
    purgeSession();
    alert('Security incident detected. Session purged.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CryptoProvider>
        <App />
      </CryptoProvider>
    </AuthProvider>
  </React.StrictMode>
);

window.addEventListener('beforeunload', () => {
  purgeSession();
});