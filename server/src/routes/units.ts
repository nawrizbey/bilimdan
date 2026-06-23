import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { notFound } from '../lib/errors';

export const unitsRouter = Router();

unitsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: { words: { select: { id: true } } },
    });
    const knownProgress = await prisma.userWordProgress.findMany({
      where: { userId: req.userId, known: true },
      select: { wordId: true },
    });
    const knownWordIds = new Set(knownProgress.map((p) => p.wordId));

    const result = units.map((u) => {
      const wordIds = u.words.map((w) => w.id);
      const wordsCount = wordIds.length;
      const knownCount = wordIds.filter((id) => knownWordIds.has(id)).length;
      const pct = wordsCount > 0 ? Math.round((knownCount / wordsCount) * 100) : 0;
      return { id: u.id, title: u.title, order: u.order, emoji: u.emoji, wordsCount, pct };
    });

    res.json({ units: result });
  } catch (err) {
    next(err);
  }
});

unitsRouter.get('/:id/words', requireAuth, async (req, res, next) => {
  try {
    const unitId = Number(req.params.id);
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw notFound('Mavzu topilmadi');

    const words = await prisma.word.findMany({ where: { unitId }, orderBy: { order: 'asc' } });
    const progress = await prisma.userWordProgress.findMany({
      where: { userId: req.userId, wordId: { in: words.map((w) => w.id) } },
    });
    const knownMap = new Map(progress.map((p) => [p.wordId, p.known]));

    res.json({
      unit: { id: unit.id, title: unit.title, emoji: unit.emoji },
      words: words.map((w) => ({
        id: w.id,
        en: w.en,
        ipa: w.ipa,
        uz: w.uz,
        example: w.example,
        emoji: w.emoji,
        known: knownMap.get(w.id) ?? false,
      })),
    });
  } catch (err) {
    next(err);
  }
});
