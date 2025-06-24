import { purgeSession as cryptoPurge } from '../crypto/zeroizeUtils';
import { clearAuthTokens } from './authUtils';

export const purgeSession = () => {

  clearAuthTokens();
  
  cryptoPurge();
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
  
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => caches.delete(cacheName));
  });
  
  const elements = document.querySelectorAll('[data-crypto-sensitive]');
  elements.forEach(el => {
    el.textContent = '\x00'.repeat(el.textContent.length);
    el.remove();
  });
  
  console.info('Session purged securely');
};

export const schedulePurge = (timeout = 900000) => { 
  let purgeTimer = setTimeout(() => {
    purgeSession();
    alert('Session purged due to inactivity');
  }, timeout);
  
  const resetTimer = () => {
    clearTimeout(purgeTimer);
    purgeTimer = setTimeout(() => {
      purgeSession();
      alert('Session purged due to inactivity');
    }, timeout);
  };
  
  ['mousemove', 'keydown', 'click'].forEach(event => {
    window.addEventListener(event, resetTimer);
  });
  
  return () => clearTimeout(purgeTimer);
};