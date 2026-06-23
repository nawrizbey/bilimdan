import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { awardProgress } from '../lib/progress';
import { badRequest } from '../lib/errors';

export const speakRouter = Router();

const SPEAK_ATTEMPT_MINUTES = 1;

speakRouter.post('/result', requireAuth, rateLimit(30, 60_000), async (req, res, next) => {
  try {
    const { score } = req.body ?? {};
    const scoreNum = Number(score);
    if (Number.isNaN(scoreNum)) throw badRequest("Ball noto'g'ri");
    const clamped = Math.max(0, Math.min(100, Math.round(scoreNum)));

    const user = await awardProgress(req.userId!, {
      minutes: SPEAK_ATTEMPT_MINUTES,
      xpGain: Math.round(clamped / 10),
      extra: { speakAttemptsCount: { increment: 1 } },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
