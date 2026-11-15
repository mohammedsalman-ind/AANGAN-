import { Router } from 'express';
import crypto from 'crypto';
import { CheckinSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth } from '../auth/middleware.js';
import type { Checkin } from '@aangan/shared';

export const checkinsRouter = Router();

// Get checkins
checkinsRouter.get('/', requireAuth, async (req, res) => {
  // Enforce Privacy Dial for non-elders
  if (req.member!.role !== 'elder' && !req.member!.privacyDials?.canSeeCheckins) {
    res.status(403).json({
      error: 'Elder ne tabiyat ki jaankari (check-ins) private rakhi hai.',
      privacyRestricted: true,
    });
    return;
  }

  const checkins = await storage.getCheckinsByCircle(req.user!.circleId, 30);
  res.json(checkins);
});

// Create daily checkin
checkinsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const data = CheckinSchema.parse(req.body);
    const todayStr = new Date().toISOString().split('T')[0];

    const checkin: Checkin = {
      id: 'checkin-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      memberId: req.user!.memberId,
      date: todayStr,
      mood: data.mood,
      symptoms: data.symptoms,
      note: data.note,
      createdAt: new Date().toISOString(),
    };

    await storage.createCheckin(checkin);

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'CHECKIN_LOGGED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { mood: data.mood, symptoms: data.symptoms },
    });

    res.status(201).json(checkin);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit checkin.' });
  }
});
