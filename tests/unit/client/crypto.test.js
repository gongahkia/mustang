import { encrypt, decrypt, generateKey } from '../../../client/src/crypto/aesHandler';
import { generateKeyPair, deriveSharedSecret } from '../../../client/src/crypto/ecdhManager';
import { zeroizeArray } from '../../../client/src/crypto/zeroizeUtils';

const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    deriveKey: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

beforeAll(() => {
  global.crypto = mockCrypto;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AES Handler', () => {
  it('encrypts and decrypts data correctly', async () => {
    const key = await generateKey();
    const plaintext = new TextEncoder().encode('Secret message');
    
    mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1,2,3]));
    mockCrypto.subtle.decrypt.mockResolvedValue(plaintext);
    
    const { ciphertext, iv } = await encrypt(plaintext, key);
    const result = await decrypt(ciphertext, iv, key);
    
    expect(result).toEqual(plaintext);
    expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
  });
});

describe('ECDH Manager', () => {
  it('derives shared secret correctly', async () => {
    const privateKey = { type: 'private' };
    const publicKey = { type: 'public' };
    
    await deriveSharedSecret(privateKey, publicKey);
    
    expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ECDH', public: publicKey }),
      privateKey,
      expect.any(Object),
      false,
      ['encrypt', 'decrypt']
    );
  });
});

describe('Zeroize Utilities', () => {
  it('securely zeroizes arrays', () => {
    const arr = new Uint8Array([1, 2, 3, 4]);
    zeroizeArray(arr);
    
    expect(arr).toEqual(new Uint8Array([0, 0, 0, 0]));
  });
});