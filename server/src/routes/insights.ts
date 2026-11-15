import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { storage } from '../storage/index.js';
import { PatternInsightsService } from '../services/patternInsights.js';

export const insightsRouter = Router();
const insightsService = new PatternInsightsService(storage);

insightsRouter.get('/', requireAuth, async (req, res) => {
  // If non-elder and elder hid checkins or adherence
  if (req.member!.role !== 'elder') {
    if (!req.member!.privacyDials?.canSeeCheckins && !req.member!.privacyDials?.canSeeAdherence) {
      res.status(403).json({
        error: 'Elder ne health pattern insights private rakhe hain.',
        privacyRestricted: true,
      });
      return;
    }
  }

  const insights = await insightsService.generateInsights(req.user!.circleId);
  res.json(insights);
});
