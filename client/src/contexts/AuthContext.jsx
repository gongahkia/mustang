import React, { createContext, useState, useEffect, useCallback } from 'react';
import { firebaseAuth } from '../utils/firebaseConfig';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { zeroizeLocalStorage } from '../crypto/zeroizeUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const hardwareSignIn = useCallback(async () => {
    try {
      const publicKey = {
        challenge: new Uint8Array(32),
        rp: { id: 'mustang-secure.io', name: 'MUSTANG' },
        user: { id: new Uint8Array(16), name: 'user@mustang', displayName: 'User' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { userVerification: 'required' },
        timeout: 60000,
        attestation: 'direct'
      };

      const credential = await navigator.credentials.create({ publicKey });
      return credential;
    } catch (error) {
      console.error('Hardware auth failed:', error);
      zeroizeLocalStorage();
      throw error;
    }
  }, []);

  const login = useCallback(async () => {
    try {
      const hardwareCredential = await hardwareSignIn();
      const idToken = await verifyHardwareCredential(hardwareCredential);
      
      const auth = getAuth();
      const userCredential = await signInWithCustomToken(auth, idToken);
      setCurrentUser(userCredential.user);
    } catch (error) {
      zeroizeLocalStorage();
      throw error;
    }
  }, [hardwareSignIn]);

  const logout = useCallback(() => {
    const auth = getAuth();
    signOut(auth).then(() => {
      setCurrentUser(null);
      zeroizeLocalStorage();
    });
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setIsInitializing(false);
      
      const inactivityTimer = setTimeout(() => {
        if (user) {
          logout();
        }
      }, 900000);
      
      return () => clearTimeout(inactivityTimer);
    });

    return unsubscribe;
  }, [logout]);

  const value = {
    currentUser,
    isInitializing,
    login,
    logout,
    hardwareSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const verifyHardwareCredential = async (credential) => {
  // FUA to add proper backend verification checks
  return 'mock-jwt-token';
};