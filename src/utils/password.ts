import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored || !stored.includes(':')) {
    return false;
  }

  const [salt, key] = stored.split(':');
  const hash = scryptSync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== hash.length) {
    return false;
  }

  return timingSafeEqual(hash, keyBuffer);
}
