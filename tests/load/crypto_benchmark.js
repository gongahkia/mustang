import { crypto } from 'k6/experimental/webcrypto';
import { check } from 'k6';

export default async function () {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode('MUSTANG SECURE MESSAGE');
  
  const encryptStart = Date.now();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );
  const encryptDuration = Date.now() - encryptStart;
  
  const decryptStart = Date.now();
  await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
  const decryptDuration = Date.now() - decryptStart;
  
  const ecdhStart = Date.now();
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
  
  const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: keyPair.publicKey },
    keyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const ecdhDuration = Date.now() - ecdhStart;
  
  const hashStart = Date.now();
  const hash1 = await crypto.subtle.digest('SHA-256', data);
  const hash2 = await crypto.subtle.digest('SHA-256', 
    new Uint8Array([...new Uint8Array(hash1), ...data])
  );
  const hashDuration = Date.now() - hashStart;
  
  console.log(JSON.stringify({
    aes_encrypt: encryptDuration,
    aes_decrypt: decryptDuration,
    ecdh_key_exchange: ecdhDuration,
    hash_chain: hashDuration
  }));
}