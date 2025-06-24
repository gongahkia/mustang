import React, { createContext, useState, useEffect, useCallback } from 'react';
import { generateEphemeralKey, deriveSharedSecret } from '../crypto/ecdhManager';
import { encryptMessage, decryptMessage } from '../crypto/aesHandler';
import { buildHashChain, verifyChain } from '../crypto/hashChain';
import { zeroizeArray } from '../crypto/zeroizeUtils';

export const CryptoContext = createContext();

export const CryptoProvider = ({ children }) => {
  const [ephemeralKey, setEphemeralKey] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [hashChain, setHashChain] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const initCrypto = async () => {
      setIsGenerating(true);
      try {
        const keyPair = await generateEphemeralKey();
        setEphemeralKey(keyPair);
      } catch (error) {
        console.error('Key generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    initCrypto();

    return () => {
      if (ephemeralKey) {
        window.crypto.subtle.zeroize(ephemeralKey.privateKey);
      }
      zeroizeArray(sharedSecret);
    };
  }, []);

  const establishSession = useCallback(async (peerPublicKey) => {
    if (!ephemeralKey) throw new Error('Ephemeral key not ready');
    
    try {
      const secret = await deriveSharedSecret(ephemeralKey.privateKey, peerPublicKey);
      setSharedSecret(secret);
      return ephemeralKey.publicKey;
    } catch (error) {
      zeroizeArray(sharedSecret);
      throw error;
    }
  }, [ephemeralKey]);

  const encryptData = useCallback(async (message) => {
    if (!sharedSecret) throw new Error('No shared secret established');
    
    const { ciphertext, iv } = await encryptMessage(message, sharedSecret);
    const newChain = buildHashChain(hashChain, ciphertext);
    
    setHashChain(newChain);
    return { ciphertext, iv, chainHash: newChain[newChain.length - 1] };
  }, [sharedSecret, hashChain]);

  const decryptData = useCallback(async (ciphertext, iv, chainData) => {
    if (!sharedSecret) throw new Error('No shared secret established');
    
    const plaintext = await decryptMessage(ciphertext, iv, sharedSecret);
    
    if (!verifyChain(chainData, ciphertext)) {
      throw new Error('Hash chain verification failed');
    }
    
    return plaintext;
  }, [sharedSecret]);

  const purgeSession = useCallback(() => {
    if (ephemeralKey) {
      window.crypto.subtle.zeroize(ephemeralKey.privateKey);
    }
    zeroizeArray(sharedSecret);
    setHashChain([]);
    setEphemeralKey(null);
    setSharedSecret(null);
  }, [ephemeralKey, sharedSecret]);

  const value = {
    ephemeralKey,
    sharedSecret,
    hashChain,
    isGenerating,
    establishSession,
    encryptData,
    decryptData,
    purgeSession
  };

  return (
    <CryptoContext.Provider value={value}>
      {children}
    </CryptoContext.Provider>
  );
};