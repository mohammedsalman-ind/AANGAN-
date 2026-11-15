import { Router } from 'express';
import crypto from 'crypto';
import { storage } from '../storage/index.js';
import { emailInboxStore } from '../services/email.js';
import { AlertEngine } from '../services/alertEngine.js';
import { verifyActionToken } from '../auth/jwt.js';
import { materializeDosesForDate } from '../services/doseMaterializer.js';
import type { SlotType } from '@aangan/shared';

export const demoRouter = Router();
const alertEngine = new AlertEngine(storage);

// Track used action tokens for single-use enforcement
const usedActionTokens = new Set<string>();

// Get recent emails sent (In-Memory Inbox Viewer for judges)
demoRouter.get('/inbox', async (_req, res) => {
  res.json(emailInboxStore.slice(0, 15));
});

// Force-run alert engine tick
demoRouter.post('/trigger-engine', async (req, res) => {
  const circle = await storage.findCircleByJoinCode('AANGAN');
  if (!circle) {
    res.status(404).json({ error: 'Circle AANGAN not found.' });
    return;
  }
  const result = await alertEngine.runTick(circle.id);
  res.json({ message: 'Alert engine tick executed.', ...result });
});

// Fast-forward / simulate missed dose
demoRouter.post('/simulate-missed', async (req, res) => {
  try {
    const circle = await storage.findCircleByJoinCode('AANGAN');
    if (!circle) {
      res.status(404).json({ error: 'Circle AANGAN not found.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    await materializeDosesForDate(storage, circle.id, todayStr);
    const doses = await storage.getDosesByCircleAndDate(circle.id, todayStr);

    const slot = (req.body.slot as SlotType) || 'subah';
    const targetDose = doses.find((d) => d.slot === slot) || doses[0];

    if (targetDose) {
      await storage.updateDose(targetDose.id, {
        status: 'missed',
      });
    }

    // Immediately run the alert engine to trigger the email
    const engineRes = await alertEngine.runTick(circle.id);

    res.json({
      message: `Simulated missed dose for ${slot.toUpperCase()}. Alert engine fired!`,
      dose: targetDose,
      engineResult: engineRes,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Simulation failed.' });
  }
});

// One-Click Action Link Handler
demoRouter.get('/action', async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).send('<h1>Invalid Link</h1><p>Missing action token.</p>');
    return;
  }

  if (usedActionTokens.has(token)) {
    res.status(400).send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 24px; border: 1px solid #E8DCC9; border-radius: 16px; text-align: center; background: #FFF8EC;">
        <h2 style="color: #C4572E;">⚠️ Yeh Link Pehle Hi Use Ho Chuka Hai</h2>
        <p>This single-use action link was already processed.</p>
        <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #C4572E; color: #FFF; text-decoration: none; border-radius: 8px;">Aangan Dashboard Par Jayein</a>
      </div>
    `);
    return;
  }

  const payload = verifyActionToken(token);
  if (!payload) {
    res.status(400).send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 24px; border: 1px solid #E8DCC9; border-radius: 16px; text-align: center; background: #FFF8EC;">
        <h2 style="color: #B3261E;">❌ Link Expire Ho Gaya Hai Ya Galat Hai</h2>
        <p>Invalid or expired action link.</p>
      </div>
    `);
    return;
  }

  // Mark token as used
  usedActionTokens.add(token);

  const member = await storage.getMember(payload.memberId);
  const memberName = member?.name || 'Pariwar Sadasya';

  if (payload.action === 'ack_missed') {
    // Acknowledge alert and stop escalation
    if (payload.alertId) {
      await storage.updateAlert(payload.alertId, {
        ackAt: new Date().toISOString(),
      });
    }

    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: payload.circleId,
      action: 'MISSED_DOSE_ACKNOWLEDGED',
      actorId: payload.memberId,
      actorName: memberName,
      at: new Date().toISOString(),
      details: { via: 'email_one_click_link' },
    });

    res.send(`
      <div style="font-family: sans-serif; max-width: 540px; margin: 40px auto; padding: 32px; border: 1px solid #DDE5C8; border-radius: 20px; text-align: center; background: #FFF8EC; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="color: #3F4A2B;">✓ Dhanyawad, ${memberName}!</h2>
        <p style="font-size: 18px; line-height: 1.6; color: #3F4A2B;">
          Aapne confirm kar diya hai ki aap is chhooti hui dawai ko sambhal rahe hain.
        </p>
        <p style="color: #7B856B; font-size: 14px;">
          Escalation rok di gayi hai aur baaki pariwar ko alert nahi jayega.
        </p>
        <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #C4572E; color: #FFF; text-decoration: none; border-radius: 12px; font-weight: bold;">
          Aangan Kholein →
        </a>
      </div>
    `);
  } else if (payload.action === 'mark_taken') {
    // Mark dose as taken
    if (payload.doseId) {
      const dose = await storage.getDose(payload.doseId);
      if (dose) {
        await storage.updateDose(dose.id, {
          status: 'taken',
          takenAt: new Date().toISOString(),
          markedBy: payload.memberId,
        });

        const med = await storage.getMedicine(dose.medicineId);
        if (med && med.stockCount > 0) {
          await storage.updateMedicine(med.id, {
            stockCount: Math.max(0, med.stockCount - 1),
          });
        }
      }
    }

    if (payload.alertId) {
      await storage.updateAlert(payload.alertId, {
        ackAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      });
    }

    await storage.appendAuditLog({
      id: 'audit-' + crypto.randomUUID(),
      circleId: payload.circleId,
      action: 'DOSE_MARKED_TAKEN_VIA_EMAIL',
      actorId: payload.memberId,
      actorName: memberName,
      at: new Date().toISOString(),
      details: { doseId: payload.doseId },
    });

    res.send(`
      <div style="font-family: sans-serif; max-width: 540px; margin: 40px auto; padding: 32px; border: 1px solid #DDE5C8; border-radius: 20px; text-align: center; background: #FFF8EC; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="color: #3F4A2B;">🎉 Bahut Badhiya, ${memberName}!</h2>
        <p style="font-size: 18px; line-height: 1.6; color: #3F4A2B;">
          Dawai li gayi mark ho chuki hai aur stock update ho gaya hai.
        </p>
        <p style="color: #7B856B; font-size: 14px;">
          Dadaji ka pillbox update ho gaya hai.
        </p>
        <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #C4572E; color: #FFF; text-decoration: none; border-radius: 12px; font-weight: bold;">
          Aangan Kholein →
        </a>
      </div>
    `);
  }
});
