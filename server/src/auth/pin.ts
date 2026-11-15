import crypto from 'crypto';
import { promisify } from 'util';
import { CONFIG } from '../config.js';

const scryptAsync = promisify(crypto.scrypt);

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.randomBytes(CONFIG.saltBytes).toString('hex');
  const derivedKey = (await scryptAsync(pin, salt, CONFIG.keyLen)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(pin, salt, keyBuffer.length)) as Buffer;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

export function isMemberLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  const lockTime = new Date(lockedUntil).getTime();
  return lockTime > Date.now();
}

export function calculateLockoutUntil(): string {
  return new Date(Date.now() + CONFIG.lockoutMinutes * 60 * 1000).toISOString();
}
