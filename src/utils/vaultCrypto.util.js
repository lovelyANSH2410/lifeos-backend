import crypto from 'crypto';
import env from '../config/env.js';
import logger from './logger.util.js';

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits) for AES-256
 */
const getEncryptionKey = () => {
  const key = env.VAULT_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('VAULT_ENCRYPTION_KEY environment variable is required');
  }

  // If key is provided as hex string, convert to buffer
  // Otherwise, use it directly (assuming it's base64 or hex)
  let keyBuffer;
  
  try {
    // Try to parse as hex
    keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
      // If not 32 bytes, try base64
      keyBuffer = Buffer.from(key, 'base64');
      if (keyBuffer.length !== 32) {
        // If still not 32 bytes, derive key using SHA-256
        keyBuffer = crypto.createHash('sha256').update(key).digest();
      }
    }
  } catch (error) {
    // If parsing fails, derive key using SHA-256
    keyBuffer = crypto.createHash('sha256').update(key).digest();
  }

  return keyBuffer;
};

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plaintext to encrypt
 * @returns {Object} Encrypted object with iv, content, and tag
 */
export const encrypt = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      content: encrypted,
      tag: tag.toString('hex')
    };
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted object using AES-256-GCM
 * @param {Object} encryptedObject - Object with iv, content, and tag
 * @returns {string} Decrypted plaintext
 */
export const decrypt = (encryptedObject) => {
  try {
    if (!encryptedObject || typeof encryptedObject !== 'object') {
      throw new Error('Encrypted object is required');
    }

    const { iv, content, tag } = encryptedObject;

    if (!iv || !content || !tag) {
      throw new Error('Invalid encrypted object structure');
    }

    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
    decipher.setAuthTag(tagBuffer);

    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    throw new Error('Failed to decrypt data');
  }
};
