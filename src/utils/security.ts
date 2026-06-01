/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Basic offline secure utility for Echelon.
 * Uses a lightweight symmetric XOR cipher with key stretching based on the user's PIN/Password.
 * It prepends a validation signature to verify the integrity of the decryption.
 */

const SIGNATURE = 'ECHELON_SECURE_VAL_V2:';

/**
 * Simple hash function to store a fast, secure representation of PIN for quick check/matches.
 */
export function hashPin(pin: string): string {
  let hash = 0;
  const combined = pin + 'EchelonQuietWealthSalt2026';
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Key stretching to derive a dynamic encryption key from PIN.
 */
function stretchKey(pin: string, length: number): number[] {
  const keyBytes: number[] = [];
  const salt = 'EchelonBrushedBricksVaultAccess2026';
  const source = pin + salt;
  
  for (let i = 0; i < length; i++) {
    let code = 0;
    for (let j = 0; j < source.length; j++) {
      code += source.charCodeAt(j) * (i + j + 1);
    }
    keyBytes.push((code ^ i) % 256);
  }
  return keyBytes;
}

/**
 * Encrypts a plaintext string using the user's PIN.
 */
export function encryptData(plaintext: string, pin: string): string {
  const signedText = SIGNATURE + plaintext;
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(signedText);
  const keyBytes = stretchKey(pin, textBytes.length);
  
  const encryptedBytes = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    encryptedBytes[i] = textBytes[i] ^ keyBytes[i];
  }
  
  // Convert byte array to hexadecimal string for storage
  return Array.from(encryptedBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decrypts a hexadecimal ciphertext string using the user's PIN.
 * Returns null if decryption fails (incorrect PIN or corrupted payload).
 */
export function decryptData(hexCiphertext: string, pin: string): string | null {
  if (!hexCiphertext || hexCiphertext.trim() === '') {
    return null;
  }
  
  try {
    // Parse hexadecimal string back to byte array
    const bytesLength = hexCiphertext.length / 2;
    const encryptedBytes = new Uint8Array(bytesLength);
    for (let i = 0; i < bytesLength; i++) {
      encryptedBytes[i] = parseInt(hexCiphertext.substring(i * 2, i * 2 + 2), 16);
    }
    
    const keyBytes = stretchKey(pin, encryptedBytes.length);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i];
    }
    
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBytes);
    
    if (decryptedString.startsWith(SIGNATURE)) {
      return decryptedString.substring(SIGNATURE.length);
    }
  } catch (err) {
    console.error('Error during decryption check:', err);
  }
  
  return null;
}
