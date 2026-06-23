import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { awardProgress } from '../lib/progress';
import { badRequest, notFound } from '../lib/errors';

export const learnRouter = Router();

const SESSION_MINUTES_CAP = 20;
const WRITE_CORRECT_XP = 6;
const TEST_CORRECT_XP = 12;

function nonNegativeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

learnRouter.post('/session-complete', requireAuth, rateLimit(15, 60_000), async (req, res, next) => {
  try {
    const { unitId, writeCorrect, testCorrect } = req.body ?? {};
    const unitIdNum = Number(unitId);
    if (!unitIdNum) throw badRequest("Mavzu ko'rsatilmagan");

    const unit = await prisma.unit.findUnique({ where: { id: unitIdNum } });
    if (!unit) throw notFound('Mavzu topilmadi');

    const words = await prisma.word.findMany({ where: { unitId: unitIdNum } });
    if (words.length === 0) throw badRequest("Bu mavzuda so'zlar yo'q");

    const existing = await prisma.userWordProgress.findMany({
      where: { userId: req.userId!, wordId: { in: words.map((w) => w.id) } },
      select: { wordId: true, known: true },
    });
    const alreadyKnown = new Set(existing.filter((p) => p.known).map((p) => p.wordId));
    const wordsKnownIncrement = words.filter((w) => !alreadyKnown.has(w.id)).length;

    await prisma.$transaction(
      words.map((w) =>
        prisma.userWordProgress.upsert({
          where: { userId_wordId: { userId: req.userId!, wordId: w.id } },
          update: { known: true, knownAt: new Date() },
          create: { userId: req.userId!, wordId: w.id, known: true, knownAt: new Date() },
        }),
      ),
    );

    const xpGain = nonNegativeInt(writeCorrect) * WRITE_CORRECT_XP + nonNegativeInt(testCorrect) * TEST_CORRECT_XP;

    const user = await awardProgress(req.userId!, {
      minutes: Math.min(words.length, SESSION_MINUTES_CAP),
      xpGain,
      extra: wordsKnownIncrement ? { wordsKnownCount: { increment: wordsKnownIncrement } } : {},
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
