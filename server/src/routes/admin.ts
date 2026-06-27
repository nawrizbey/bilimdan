import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Admin auth middleware
// ---------------------------------------------------------------------------

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(401).json({ error: 'Admin not configured' });
    return;
  }
  const auth = req.headers.authorization ?? '';
  if (auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

adminRouter.use(requireAdmin);

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [userCount, wordCount, unitCount, quizCount, battleCount, listenCount] = await Promise.all([
      prisma.user.count(),
      prisma.word.count(),
      prisma.unit.count(),
      prisma.quizQuestion.count(),
      prisma.battleQuestion.count(),
      prisma.listenQuestion.count(),
    ]);
    res.json({
      userCount,
      wordCount,
      unitCount,
      questionCount: { quiz: quizCount, battle: battleCount, listen: listenCount },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

adminRouter.get('/units', async (_req, res, next) => {
  try {
    const raw = await prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: { words: { select: { id: true } } },
    });
    const units = raw.map((u) => ({
      id: u.id,
      title: u.title,
      order: u.order,
      emoji: u.emoji,
      wordCount: u.words.length,
    }));
    res.json({ units });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/units', async (req, res, next) => {
  try {
    const { title, order, emoji } = req.body ?? {};
    const unit = await prisma.unit.create({ data: { title, order: Number(order), emoji } });
    res.json({ unit });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/units/:id', async (req, res, next) => {
  try {
    const unitId = Number(req.params.id);
    // Delete child word progress records first, then words, then the unit
    const words = await prisma.word.findMany({ where: { unitId }, select: { id: true } });
    const wordIds = words.map((w) => w.id);
    if (wordIds.length > 0) {
      await prisma.userWordProgress.deleteMany({ where: { wordId: { in: wordIds } } });
      await prisma.word.deleteMany({ where: { unitId } });
    }
    await prisma.unit.delete({ where: { id: unitId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

adminRouter.get('/units/:id/words', async (req, res, next) => {
  try {
    const unitId = Number(req.params.id);
    const words = await prisma.word.findMany({
      where: { unitId },
      orderBy: { order: 'asc' },
      select: { id: true, en: true, ipa: true, uz: true, example: true, emoji: true, order: true },
    });
    res.json({ words });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/units/:id/words', async (req, res, next) => {
  try {
    const unitId = Number(req.params.id);
    const { en, ipa, uz, example, emoji } = req.body ?? {};
    const agg = await prisma.word.aggregate({ where: { unitId }, _max: { order: true } });
    const nextOrder = (agg._max.order ?? 0) + 1;
    const word = await prisma.word.create({
      data: { unitId, en, ipa, uz, example, emoji, order: nextOrder },
    });
    res.json({ word });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/words/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.userWordProgress.deleteMany({ where: { wordId: id } });
    await prisma.word.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

adminRouter.get('/questions/quiz', async (_req, res, next) => {
  try {
    const questions = await prisma.quizQuestion.findMany({ orderBy: { order: 'asc' } });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/questions/quiz', async (req, res, next) => {
  try {
    const { question, options, correctIndex } = req.body ?? {};
    const agg = await prisma.quizQuestion.aggregate({ _max: { order: true } });
    const nextOrder = (agg._max.order ?? 0) + 1;
    const created = await prisma.quizQuestion.create({
      data: { question, options, correctIndex: Number(correctIndex), order: nextOrder },
    });
    res.json({ question: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/questions/quiz/:id', async (req, res, next) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Battle questions
// ---------------------------------------------------------------------------

adminRouter.get('/questions/battle', async (_req, res, next) => {
  try {
    const questions = await prisma.battleQuestion.findMany({ orderBy: { order: 'asc' } });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/questions/battle', async (req, res, next) => {
  try {
    const { question, options, correctIndex } = req.body ?? {};
    const agg = await prisma.battleQuestion.aggregate({ _max: { order: true } });
    const nextOrder = (agg._max.order ?? 0) + 1;
    const created = await prisma.battleQuestion.create({
      data: { question, options, correctIndex: Number(correctIndex), order: nextOrder },
    });
    res.json({ question: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/questions/battle/:id', async (req, res, next) => {
  try {
    await prisma.battleQuestion.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Listen questions
// ---------------------------------------------------------------------------

adminRouter.get('/questions/listen', async (_req, res, next) => {
  try {
    const questions = await prisma.listenQuestion.findMany({ orderBy: { order: 'asc' } });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/questions/listen', async (req, res, next) => {
  try {
    const { sentence, options, correctIndex } = req.body ?? {};
    const agg = await prisma.listenQuestion.aggregate({ _max: { order: true } });
    const nextOrder = (agg._max.order ?? 0) + 1;
    const created = await prisma.listenQuestion.create({
      data: { sentence, options, correctIndex: Number(correctIndex), order: nextOrder },
    });
    res.json({ question: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/questions/listen/:id', async (req, res, next) => {
  try {
    await prisma.listenQuestion.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

adminRouter.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, raw] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          xp: true,
          streak: true,
          createdAt: true,
          region: { select: { name: true } },
          district: { select: { name: true } },
          school: { select: { name: true } },
        },
      }),
    ]);

    const users = raw.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      xp: u.xp,
      streak: u.streak,
      createdAt: u.createdAt,
      region: u.region.name,
      district: u.district.name,
      school: u.school.name,
    }));

    res.json({ users, total });
  } catch (err) {
    next(err);
  }
});
