const ALGORITHM = { name: 'ECDH', namedCurve: 'P-256' };

export const generateKeyPair = async () => {
  return crypto.subtle.generateKey(ALGORITHM, true, ['deriveKey', 'deriveBits']);
};

export const deriveSharedSecret = async (privateKey, publicKey) => {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const exportPublicKey = async (key) => {
  return crypto.subtle.exportKey('raw', key);
};

export const importPublicKey = async (rawKey) => {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
};

export const zeroizePrivateKey = async (key) => {
  if (key instanceof CryptoKey) {
    crypto.subtle.zeroize(key);
  }
};