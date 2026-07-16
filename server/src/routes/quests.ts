import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTodayQuests } from '../lib/quests';

export const questsRouter = Router();

questsRouter.get('/today', requireAuth, async (req, res, next) => {
  try {
    const quests = await getTodayQuests(req.userId!);
    res.json({ quests });
  } catch (err) {
    next(err);
  }
});
