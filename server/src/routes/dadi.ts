import { Router } from 'express';
import { DadiRequestSchema } from '@aangan/shared';
import { requireAuth } from '../auth/middleware.js';
import { storage } from '../storage/index.js';
import { DadiAgent } from '../services/dadiAgent.js';
import rateLimit from 'express-rate-limit';

export const dadiRouter = Router();

const dadiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests per minute per IP
  message: { error: 'Thoda dheere bolein, Dadi sun rahi hain. Ek minute me punah prayas karein.' },
});

const dadiAgent = new DadiAgent(storage);

dadiRouter.post('/', dadiLimiter, requireAuth, async (req, res) => {
  try {
    const data = DadiRequestSchema.parse(req.body);

    const members = await storage.getMembersByCircle(req.user!.circleId);
    const elder = members.find((m) => m.role === 'elder') || req.member;

    const result = await dadiAgent.processMessage({
      circleId: req.user!.circleId,
      elderId: elder?.id || req.user!.memberId,
      elderName: elder?.name || 'Dadaji',
      userMessage: data.message,
      history: data.history as any,
      confirmPendingAction: data.confirmPendingAction,
      pendingCompartment: (req.body.pendingCompartment as any) || undefined,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Dadi ko samajhne me asuvidha hui. Kripya dubara bolein.',
      reply: 'Maaf kijiye, main theek se sun nahi payi. Kripya dubara boliye.',
    });
  }
});
