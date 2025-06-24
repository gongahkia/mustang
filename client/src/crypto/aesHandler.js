const ALGORITHM = { name: 'AES-GCM', length: 256 };
const IV_LENGTH = 12; 
const TAG_LENGTH = 128; 

export const encrypt = async (plaintext, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM.name, iv, tagLength: TAG_LENGTH },
    key,
    plaintext
  );
  return { iv, ciphertext };
};

export const decrypt = async (ciphertext, iv, key) => {
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM.name, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );
  return new Uint8Array(plaintext);
};

export const generateKey = async () => {
  return crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt']);
};

export const exportKey = async (key) => {
  return crypto.subtle.exportKey('raw', key);
};

export const importKey = async (rawKey) => {
  return crypto.subtle.importKey('raw', rawKey, ALGORITHM, true, ['encrypt', 'decrypt']);
};