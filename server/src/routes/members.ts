import { Router } from 'express';
import crypto from 'crypto';
import { AddMemberSchema, ResetMemberPinSchema, PrivacyDialsSchema } from '@aangan/shared';
import { storage } from '../storage/index.js';
import { requireAuth, requireElder } from '../auth/middleware.js';
import { hashPin } from '../auth/pin.js';
import type { Member, SafeMember } from '@aangan/shared';

export const membersRouter = Router();

function toSafeMember(m: Member): SafeMember {
  const { pinHash: _pinHash, ...safe } = m;
  return safe;
}

// Get all members of circle
membersRouter.get('/', requireAuth, async (req, res) => {
  const members = await storage.getMembersByCircle(req.user!.circleId);
  res.json(members.map(toSafeMember));
});

// Elder adds a new member
membersRouter.post('/', requireAuth, requireElder, async (req, res) => {
  try {
    const data = AddMemberSchema.parse(req.body);

    // Generate 4-digit PIN if not supplied
    const oneTimePin = data.initialPin || Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = await hashPin(oneTimePin);

    const memberId = 'member-' + crypto.randomUUID();
    const newMember: Member = {
      id: memberId,
      circleId: req.user!.circleId,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      email: data.email,
      pinHash,
      privacyDials: {
        canSeeAdherence: data.privacyDials?.canSeeAdherence ?? true,
        canSeeCheckins: data.privacyDials?.canSeeCheckins ?? true,
        canSeeAppointments: data.privacyDials?.canSeeAppointments ?? true,
        canEditMedicines: data.privacyDials?.canEditMedicines ?? (data.role === 'caretaker'),
        getMissedAlerts: data.privacyDials?.getMissedAlerts ?? true,
        missedAlertDelayMin: data.privacyDials?.missedAlertDelayMin ?? (data.role === 'caretaker' ? 15 : 45),
      },
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };

    await storage.createMember(newMember);

    // Log audit
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'MEMBER_ADDED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { memberName: data.name, role: data.role, email: data.email },
    });

    // Change receipt
    await storage.createReceipt({
      id: 'receipt-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      entity: 'medicine',
      entityId: newMember.id,
      description: `Elder ne naye sadasya ${data.name} (${data.role}) ko Aangan me joda`,
      before: null,
      after: { name: data.name, role: data.role, email: data.email },
      changedBy: req.user!.memberId,
      changedByName: req.user!.name,
      changedAt: new Date().toISOString(),
      reversedAt: null,
      acknowledgedByElder: true,
    });

    res.status(201).json({
      member: toSafeMember(newMember),
      oneTimePin, // Shown ONCE to the elder
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add member.' });
  }
});

// Elder resets a member's PIN
membersRouter.post('/reset-pin', requireAuth, requireElder, async (req, res) => {
  try {
    const { memberId, newPin } = ResetMemberPinSchema.parse(req.body);
    const member = await storage.getMember(memberId);
    if (!member || member.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const pinHash = await hashPin(newPin);
    await storage.updateMember(memberId, {
      pinHash,
      failedAttempts: 0,
      lockedUntil: null,
    });

    // Log audit
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'PIN_RESET',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { targetMemberId: memberId, targetMemberName: member.name },
    });

    res.json({ message: `${member.name} ka PIN safaltapoorvak badal diya gaya.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset PIN.' });
  }
});

// Elder updates privacy dials for a member
membersRouter.patch('/:id/dials', requireAuth, requireElder, async (req, res) => {
  try {
    const memberId = String(req.params.id);
    const member = await storage.getMember(memberId);
    if (!member || member.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const newDials = PrivacyDialsSchema.parse(req.body);
    const beforeDials = { ...member.privacyDials };

    const updated = await storage.updateMember(memberId, {
      privacyDials: newDials,
    });

    // Log audit
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'PRIVACY_DIALS_UPDATED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { targetMemberId: memberId, targetMemberName: member.name, before: beforeDials, after: newDials },
    });

    // Change receipt
    await storage.createReceipt({
      id: 'receipt-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      entity: 'privacy_dials',
      entityId: memberId,
      description: `Elder ne ${member.name} ke privacy dials update kiye`,
      before: beforeDials,
      after: newDials,
      changedBy: req.user!.memberId,
      changedByName: req.user!.name,
      changedAt: new Date().toISOString(),
      reversedAt: null,
      acknowledgedByElder: true,
    });

    res.json({ member: toSafeMember(updated!) });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update privacy dials.' });
  }
});
