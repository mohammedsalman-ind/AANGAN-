import { Router } from 'express';
import { storage } from '../storage/index.js';
import { requireAuth, requireElder } from '../auth/middleware.js';

export const auditRouter = Router();

// Elder-only Activity log view
auditRouter.get('/', requireAuth, requireElder, async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const logs = await storage.getAuditLogsByCircle(req.user!.circleId, limit);
  res.json(logs);
});
