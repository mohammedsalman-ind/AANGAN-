import { Router } from 'express';
import crypto from 'crypto';
import { storage } from '../storage/index.js';
import { requireAuth, requireElder } from '../auth/middleware.js';

export const receiptsRouter = Router();

// Get change receipts (Elder only)
receiptsRouter.get('/', requireAuth, requireElder, async (req, res) => {
  const receipts = await storage.getReceiptsByCircle(req.user!.circleId, 50);
  res.json(receipts);
});

// Elder reverses a change receipt within 24 hours
receiptsRouter.post('/:id/reverse', requireAuth, requireElder, async (req, res) => {
  try {
    const receipt = await storage.getReceipt(String(req.params.id));
    if (!receipt || receipt.circleId !== req.user!.circleId) {
      res.status(404).json({ error: 'Change receipt not found.' });
      return;
    }

    if (receipt.reversedAt) {
      res.status(400).json({ error: 'Yeh badlav pehle hi wapas (reverse) ho chuka hai.' });
      return;
    }

    // Check 24-hour limit
    const changedTime = new Date(receipt.changedAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (Date.now() - changedTime > twentyFourHoursMs) {
      res.status(400).json({
        error: '24 ghante beet chuke hain. Yeh badlav ab wapas nahi kiya ja sakta.',
      });
      return;
    }

    // Restore the 'before' state based on entity
    if (receipt.entity === 'medicine' && receipt.before) {
      await storage.updateMedicine(receipt.entityId, {
        ...(receipt.before as any),
        updatedAt: new Date().toISOString(),
      });
    } else if (receipt.entity === 'privacy_dials' && receipt.before) {
      await storage.updateMember(receipt.entityId, {
        privacyDials: receipt.before as any,
      });
    }

    const updatedReceipt = await storage.updateReceipt(receipt.id, {
      reversedAt: new Date().toISOString(),
      acknowledgedByElder: true,
    });

    // Audit log
    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: req.user!.circleId,
      action: 'CHANGE_REVERSED',
      actorId: req.user!.memberId,
      actorName: req.user!.name,
      at: new Date().toISOString(),
      details: { receiptId: receipt.id, entity: receipt.entity, description: receipt.description },
    });

    res.json({
      message: 'Badlav safaltapoorvak wapas kar diya gaya hai (Change successfully reversed).',
      receipt: updatedReceipt,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reverse change.' });
  }
});

// Elder acknowledges receipt banner
receiptsRouter.post('/:id/ack', requireAuth, requireElder, async (req, res) => {
  const receipt = await storage.getReceipt(String(req.params.id));
  if (!receipt || receipt.circleId !== req.user!.circleId) {
    res.status(404).json({ error: 'Change receipt not found.' });
    return;
  }
  const updated = await storage.updateReceipt(receipt.id, {
    acknowledgedByElder: true,
  });
  res.json(updated);
});
