import { BackupPayload, EncryptedBackupFile } from '../types';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBackup(payload: BackupPayload, passphrase: string): Promise<EncryptedBackupFile> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 200000;

  const key = await deriveKey(passphrase, salt, iterations);
  const enc = new TextEncoder();
  const encodedPayload = enc.encode(JSON.stringify(payload));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedPayload
  );

  return {
    app: 'Timerra',
    version: 1,
    encrypted: true,
    algo: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: iterations,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
}

export async function decryptBackup(encryptedFile: EncryptedBackupFile, passphrase: string): Promise<BackupPayload> {
  if (encryptedFile.app !== 'Timerra') {
    throw new Error('Only Timerra backup JSON files (.json) are accepted.');
  }

  const salt = new Uint8Array(base64ToArrayBuffer(encryptedFile.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedFile.iv));
  const ciphertext = base64ToArrayBuffer(encryptedFile.ciphertext);
  const iterations = encryptedFile.iterations || 200000;

  const key = await deriveKey(passphrase, salt, iterations);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString) as BackupPayload;
}
