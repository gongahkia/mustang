self.addEventListener('message', async (e) => {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'GENERATE_KEY': {
        const keyPair = await generateKeyPair();
        self.postMessage({ type: 'KEY_GENERATED', payload: keyPair });
        break;
      }
      
      case 'ENCRYPT': {
        const { plaintext, key } = payload;
        const result = await encrypt(plaintext, key);
        self.postMessage({ type: 'ENCRYPTED', payload: result });
        break;
      }
      
      case 'DECRYPT': {
        const { ciphertext, iv, key } = payload;
        const plaintext = await decrypt(ciphertext, iv, key);
        self.postMessage({ type: 'DECRYPTED', payload: plaintext });
        break;
      }
      
      case 'DERIVE_SECRET': {
        const { privateKey, publicKey } = payload;
        const secret = await deriveSharedSecret(privateKey, publicKey);
        self.postMessage({ type: 'SECRET_DERIVED', payload: secret });
        break;
      }
      
      case 'BUILD_CHAIN': {
        const { previousHash, ciphertext } = payload;
        const hash = await buildHash(previousHash, ciphertext);
        self.postMessage({ type: 'CHAIN_BUILT', payload: hash });
        break;
      }
      
      default:
        throw new Error(`Unknown crypto operation: ${type}`);
    }
  } catch (error) {
    self.postMessage({ type: 'CRYPTO_ERROR', payload: error.message });
  }
});

const generateKeyPair = async () => {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
};

const encrypt = async (plaintext, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    plaintext
  );
  return { iv, ciphertext };
};

const decrypt = async (ciphertext, iv, key) => {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    ciphertext
  );
};

const deriveSharedSecret = async (privateKey, publicKey) => {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const buildHash = async (previousHash, ciphertext) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(previousHash + ciphertext);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};