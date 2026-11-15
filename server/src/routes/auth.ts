import { Router } from 'express';
import crypto from 'crypto';
import { CreateCircleSchema, JoinCircleSchema, LoginPinSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { hashPin, verifyPin, isMemberLocked, calculateLockoutUntil } from '../auth/pin.js';
import { setAuthCookie, clearAuthCookie, extractAuthToken, verifyAuthToken } from '../auth/jwt.js';
import { CONFIG } from '../config.js';
import type { Circle, Member, SafeMember } from '@aangan/shared';

export const authRouter = Router();

function toSafeMember(m: Member): SafeMember {
  const { pinHash: _pinHash, ...safe } = m;
  return safe;
}

// Create new circle (Elder as head of household)
authRouter.post('/circle', async (req, res) => {
  try {
    const data = CreateCircleSchema.parse(req.body);

    // Generate unique 6-char alphanumeric join code
    let joinCode = '';
    let isUnique = false;
    for (let attempts = 0; attempts < 10; attempts++) {
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await storage.findCircleByJoinCode(code);
      if (!existing) {
        joinCode = code;
        isUnique = true;
        break;
      }
    }
    if (!isUnique) {
      joinCode = 'AANG' + Math.floor(10 + Math.random() * 89);
    }

    const circleId = 'circle-' + crypto.randomUUID();
    const circle: Circle = {
      id: circleId,
      name: data.circleName,
      joinCode,
      slotTimes: {
        subah: '08:00',
        dopahar: '13:00',
        shaam: '18:00',
        raat: '21:30',
      },
      missedAlertAfterMin: 30,
      createdAt: new Date().toISOString(),
    };
    await storage.createCircle(circle);

    const pinHash = await hashPin(data.pin);
    const memberId = 'member-' + crypto.randomUUID();
    const elderMember: Member = {
      id: memberId,
      circleId,
      name: data.elderName,
      role: 'elder',
      avatar: data.elderAvatar,
      email: data.elderEmail || '',
      pinHash,
      privacyDials: {
        canSeeAdherence: true,
        canSeeCheckins: true,
        canSeeAppointments: true,
        canEditMedicines: true,
        getMissedAlerts: true,
        missedAlertDelayMin: 0,
      },
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };
    await storage.createMember(elderMember);

    // Log audit
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId,
      action: 'CIRCLE_CREATED',
      actorId: memberId,
      actorName: data.elderName,
      at: new Date().toISOString(),
      details: { circleName: data.circleName, joinCode },
    });

    // Set cookie
    setAuthCookie(res, {
      memberId: elderMember.id,
      circleId,
      role: 'elder',
      name: elderMember.name,
    });

    res.status(201).json({
      circle,
      member: toSafeMember(elderMember),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create Aangan circle.' });
  }
});

// Lookup circle by join code
authRouter.post('/lookup', async (req, res) => {
  try {
    const { joinCode } = JoinCircleSchema.parse(req.body);
    const circle = await storage.findCircleByJoinCode(joinCode);
    if (!circle) {
      res.status(404).json({ error: 'Aangan not found with this code. Check your code or create a new Aangan.' });
      return;
    }
    const members = await storage.getMembersByCircle(circle.id);
    res.json({
      circle: {
        id: circle.id,
        name: circle.name,
        joinCode: circle.joinCode,
      },
      members: members.map(toSafeMember),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid join code.' });
  }
});

// Login via PIN
authRouter.post('/login-pin', async (req, res) => {
  try {
    const { memberId, pin } = LoginPinSchema.parse(req.body);
    const member = await storage.getMember(memberId);
    if (!member) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    // Check lockout
    if (isMemberLocked(member.lockedUntil)) {
      const remainingMs = new Date(member.lockedUntil!).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      res.status(423).json({
        error: `Yeh profile 5 minute ke liye lock hai (${remainingMin} min baki). Galat PIN zyada baar dala gaya.`,
        locked: true,
        lockedUntil: member.lockedUntil,
      });
      return;
    }

    const isValid = await verifyPin(pin, member.pinHash);
    if (!isValid) {
      const failed = member.failedAttempts + 1;
      let lockedUntil: string | null = null;
      let isNowLocked = false;

      if (failed >= CONFIG.lockoutThreshold) {
        lockedUntil = calculateLockoutUntil();
        isNowLocked = true;
      }

      await storage.updateMember(memberId, {
        failedAttempts: failed,
        lockedUntil,
      });

      // Audit log failed attempt
      await storage.appendAuditLog({
        id: 'audit-' + crypto.randomUUID(),
        circleId: member.circleId,
        action: 'LOGIN_FAILED',
        actorId: member.id,
        actorName: member.name,
        at: new Date().toISOString(),
        details: { attempts: failed, locked: isNowLocked },
      });

      if (isNowLocked) {
        res.status(423).json({
          error: 'Galat PIN 5 baar dala gaya. Suraksha ke liye profile 5 minute ke liye lock ho gaya hai.',
          locked: true,
          lockedUntil,
        });
        return;
      }

      const remainingAttempts = CONFIG.lockoutThreshold - failed;
      res.status(401).json({
        error: `Galat PIN! Kripya sahi PIN dalein (${remainingAttempts} koshish baki).`,
        remainingAttempts,
      });
      return;
    }

    // PIN is correct, reset failures
    await storage.updateMember(memberId, {
      failedAttempts: 0,
      lockedUntil: null,
    });

    const circle = await storage.getCircle(member.circleId);

    // Audit log successful login
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: member.circleId,
      action: 'LOGIN_SUCCESS',
      actorId: member.id,
      actorName: member.name,
      at: new Date().toISOString(),
      details: { role: member.role },
    });

    // Set cookie
    setAuthCookie(res, {
      memberId: member.id,
      circleId: member.circleId,
      role: member.role,
      name: member.name,
    });

    res.json({
      circle,
      member: toSafeMember(member),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Login failed.' });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Signed out successfully.' });
});

// Me (Session check)
authRouter.get('/me', async (req, res) => {
  const token = extractAuthToken(req);
  if (!token) {
    res.status(401).json({ error: 'No active session.' });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired.' });
    return;
  }
  const member = await storage.getMember(payload.memberId);
  const circle = await storage.getCircle(payload.circleId);
  if (!member || !circle) {
    res.status(401).json({ error: 'Profile or circle not found.' });
    return;
  }
  res.json({
    member: toSafeMember(member),
    circle,
  });
});
