import type { Request, Response, NextFunction } from 'express';
import { extractAuthToken, verifyAuthToken, type AuthTokenPayload } from './jwt.js';
import { storage } from '../storage/index.js';
import type { Member, RoleType } from '@aangan/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      member?: Member;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractAuthToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }
  const member = await storage.getMember(payload.memberId);
  if (!member || member.circleId !== payload.circleId) {
    res.status(401).json({ error: 'Member not found or revoked.' });
    return;
  }
  req.user = payload;
  req.member = member;
  next();
}

export function requireRole(allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.member) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!allowedRoles.includes(req.member.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`,
      });
      return;
    }
    next();
  };
}

export function requireElder(req: Request, res: Response, next: NextFunction): void {
  requireRole(['elder'])(req, res, next);
}
