import { Router } from 'express';
import crypto from 'crypto';
import { DutySchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth } from '../auth/middleware.js';
import type { Duty } from '@aangan/shared';

export const dutyRouter = Router();

// Get duty roster for date range
dutyRouter.get('/', requireAuth, async (req, res) => {
  const startDate = (req.query.startDate as string) || new Date().toISOString().split('T')[0];
  const endDate =
    (req.query.endDate as string) ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const roster = await storage.getDutyRosterByCircle(req.user!.circleId, startDate, endDate);
  res.json(roster);
});

// Set duty for a date & slot
dutyRouter.post('/', requireAuth, async (req, res) => {
  try {
    const data = DutySchema.parse(req.body);
    const assignedMember = await storage.getMember(data.memberId);
    if (!assignedMember || assignedMember.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Assigned member not found in this circle.' });
      return;
    }

    const duty: Duty = {
      id: `duty-${req.user!.circleId}-${data.date}-${data.slot}`,
      circleId: req.user!.circleId,
      date: data.date,
      slot: data.slot,
      memberId: data.memberId,
      handoffNote: data.handoffNote,
      updatedAt: new Date().toISOString(),
    };

    await storage.setDuty(duty);

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'DUTY_ASSIGNED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { date: data.date, slot: data.slot, assignedTo: assignedMember.name },
    });

    res.json(duty);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to assign duty.' });
  }
});
