import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './views/Dashboard/Dashboard';
import Login from './views/Login';
import Register from './views/Register';
import ZeroizeNotifier from './components/ZeroizeNotifier';
import './App.css';

function App() {
  useEffect(() => {
    const initCrypto = async () => {
      if ('crypto' in window) {
        await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode('initKey'),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      }
    };
    initCrypto();
  }, []);

  return (
    <AuthProvider>
      <CryptoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <ZeroizeNotifier />
        </BrowserRouter>
      </CryptoProvider>
    </AuthProvider>
  );
}

export default App;