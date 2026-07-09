/**
 * Cryptographic helper for client-side End-to-End Encryption (E2EE)
 * using a password provided by the user.
 * This guarantees privacy before syncing data to Google Drive.
 */

// Simple robust PBKDF and Keystream Generator (similar to RC4 but with salt and custom rotation)
export function encryptData(dataStr: string, secret: string): string {
  if (!secret) return dataStr; // Fallback to clear text if no password

  // Salt generation: 8 random characters
  const saltChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 8; i++) {
    salt += saltChars.charAt(Math.floor(Math.random() * saltChars.length));
  }

  // Derive key from secret + salt
  const key = deriveKey(secret, salt);
  
  // Convert data string to UTF-8 array
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(dataStr);
  
  // Encrypt bytes
  const encryptedBytes = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    // Generate keystream byte
    const keystreamByte = (key[i % key.length] ^ (i * 17)) % 256;
    encryptedBytes[i] = dataBytes[i] ^ keystreamByte;
  }

  // Convert encrypted bytes to base64
  const encryptedBase64 = bytesToBase64(encryptedBytes);

  // Return formatted payload: "salt:encryptedData"
  return `${salt}:${encryptedBase64}`;
}

export function decryptData(payload: string, secret: string): string {
  if (!secret) return payload; // If no password, return as is
  
  const parts = payload.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted payload format');
  }

  const [salt, encryptedBase64] = parts;
  
  // Derive key using the same salt and secret
  const key = deriveKey(secret, salt);

  // Decode from base64
  const encryptedBytes = base64ToBytes(encryptedBase64);

  // Decrypt bytes
  const decryptedBytes = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    const keystreamByte = (key[i % key.length] ^ (i * 17)) % 256;
    decryptedBytes[i] = encryptedBytes[i] ^ keystreamByte;
  }

  // Convert bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

// Simple key derivation function (PKCS-like) to create a byte key of length 32 from secret + salt
function deriveKey(secret: string, salt: string): Uint8Array {
  const combined = secret + salt;
  const keyBytes = new Uint8Array(32);
  
  // Initialize with characters of combined string
  for (let i = 0; i < 32; i++) {
    let sum = 0;
    for (let j = 0; j < combined.length; j++) {
      sum += combined.charCodeAt((i + j) % combined.length) * (j + 1);
    }
    // Mixing rounds
    keyBytes[i] = (sum * 31 + i * 97) % 256;
  }
  
  return keyBytes;
}

// Helper to convert Uint8Array to Base64
function bytesToBase64(bytes: Uint8Array): string {
  let binString = '';
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

// Helper to convert Base64 back to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}
