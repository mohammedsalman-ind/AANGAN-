import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Response, Request } from 'express';
import { CONFIG } from '../config.js';
import type { RoleType } from '@aangan/shared';

export interface AuthTokenPayload {
  memberId: string;
  circleId: string;
  role: RoleType;
  name: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, CONFIG.jwtSecret, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, CONFIG.jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, payload: AuthTokenPayload): void {
  const token = signAuthToken(payload);
  res.cookie(CONFIG.cookieName, token, {
    httpOnly: true,
    secure: CONFIG.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(CONFIG.cookieName, {
    httpOnly: true,
    secure: CONFIG.nodeEnv === 'production',
    sameSite: 'lax',
  });
}

export function extractAuthToken(req: Request): string | null {
  if (req.cookies && req.cookies[CONFIG.cookieName]) {
    return req.cookies[CONFIG.cookieName];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// -------------------------------------------------------------
// Signed One-Click Action Links (HMAC-SHA256, single-use, expiring)
// -------------------------------------------------------------
export interface ActionLinkPayload {
  action: 'ack_missed' | 'mark_taken';
  circleId: string;
  memberId: string;
  doseId?: string;
  alertId?: string;
  expiresAt: number; // Unix timestamp
  nonce: string;
}

export function signActionToken(payload: ActionLinkPayload): string {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString('base64url');
  const hmac = crypto
    .createHmac('sha256', CONFIG.actionSecret)
    .update(base64Data)
    .digest('base64url');
  return `${base64Data}.${hmac}`;
}

export function verifyActionToken(token: string): ActionLinkPayload | null {
  try {
    const [base64Data, hmac] = token.split('.');
    if (!base64Data || !hmac) return null;
    const expectedHmac = crypto
      .createHmac('sha256', CONFIG.actionSecret)
      .update(base64Data)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }
    const dataStr = Buffer.from(base64Data, 'base64url').toString('utf8');
    const payload = JSON.parse(dataStr) as ActionLinkPayload;
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
