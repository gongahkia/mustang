import axios from 'axios';
import { purgeSession } from '../crypto/zeroizeUtils';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, 
  headers: {
    'Content-Security-Policy': 'default-src self',
    'X-Content-Type-Options': 'nosniff'
  }
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  purgeSession();
  return Promise.reject(error);
});

apiClient.interceptors.response.use(response => {
  const requiredHeaders = ['Content-Security-Policy', 'X-Content-Type-Options'];
  requiredHeaders.forEach(header => {
    if (!response.headers[header.toLowerCase()]) {
      purgeSession();
      throw new Error(`Missing security header: ${header}`);
    }
  });
  return response;
}, error => {
  if (error.response?.status === 401) {
    purgeSession();
  }
  return Promise.reject(error);
});

export const sendSecureMessage = async (message, recipientId) => {
  try {
    const response = await apiClient.post('/messages', {
      message,
      recipientId,
      timestamp: Date.now()
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'"
      }
    });
    return response.data;
  } catch (error) {
    purgeSession();
    throw error;
  }
};

export const exchangePublicKeys = async (publicKey) => {
  const response = await apiClient.post('/keys/exchange', { publicKey });
  return response.data.peerPublicKey;
};