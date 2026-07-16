import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { generateJoinCode } from '../lib/classCode';

export const teacherRouter = Router();

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const HARD_WORDS_LIMIT = 10;

teacherRouter.use(requireAuth);

async function requireTeacher(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, schoolId: true } });
  if (!user || user.role !== 'teacher') throw forbidden('Bul bólim tek muǵallimler ushın');
  return user;
}

/** Loads a class and verifies it belongs to the requesting teacher. */
async function loadOwnedClass(userId: number, classId: number) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw notFound('Klass tabılmadı');
  if (cls.teacherId !== userId) throw forbidden('Bul klass sizge tiyisli emes');
  return cls;
}

teacherRouter.get('/classes', async (req, res, next) => {
  try {
    const userId = req.userId!;
    await requireTeacher(userId);
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
    res.json({
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        joinCode: c.joinCode,
        memberCount: c._count.members,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

teacherRouter.post('/classes', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const teacher = await requireTeacher(userId);
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) throw badRequest('Klass atı kiritilmegen');

    const joinCode = await generateJoinCode();
    const cls = await prisma.class.create({
      data: { name: name.trim(), teacherId: userId, schoolId: teacher.schoolId, joinCode },
    });
    res.json({ class: { id: cls.id, name: cls.name, joinCode: cls.joinCode, memberCount: 0, createdAt: cls.createdAt } });
  } catch (err) {
    next(err);
  }
});

teacherRouter.get('/classes/:id/roster', async (req, res, next) => {
  try {
    const userId = req.userId!;
    await requireTeacher(userId);
    const classId = Number(req.params.id);
    if (!classId) throw badRequest('Klass identifikatori qáte');
    await loadOwnedClass(userId, classId);

    const members = await prisma.classMember.findMany({
      where: { classId },
      include: { user: { select: { id: true, fullName: true, wordsKnownCount: true, xp: true, streak: true, lastActiveDate: true } } },
      orderBy: { user: { fullName: 'asc' } },
    });

    const weekStart = new Date(Date.now() - WEEK_MS);
    const blockCounts = await prisma.learnBlockProgress.groupBy({
      by: ['userId'],
      where: { userId: { in: members.map((m) => m.userId) }, completedAt: { gte: weekStart } },
      _count: { _all: true },
    });
    const blockCountByUser = new Map(blockCounts.map((b) => [b.userId, b._count._all]));

    res.json({
      roster: members.map((m) => ({
        userId: m.user.id,
        fullName: m.user.fullName,
        wordsKnownCount: m.user.wordsKnownCount,
        xp: m.user.xp,
        streak: m.user.streak,
        lastActiveDate: m.user.lastActiveDate,
        blocksThisWeek: blockCountByUser.get(m.userId) ?? 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

teacherRouter.get('/classes/:id/hard-words', async (req, res, next) => {
  try {
    const userId = req.userId!;
    await requireTeacher(userId);
    const classId = Number(req.params.id);
    if (!classId) throw badRequest('Klass identifikatori qáte');
    await loadOwnedClass(userId, classId);

    const memberIds = (await prisma.classMember.findMany({ where: { classId }, select: { userId: true } })).map((m) => m.userId);
    if (memberIds.length === 0) {
      res.json({ hardWords: [] });
      return;
    }

    const lapseSums = await prisma.userWordProgress.groupBy({
      by: ['wordId'],
      where: { userId: { in: memberIds }, lapses: { gt: 0 } },
      _sum: { lapses: true },
      orderBy: { _sum: { lapses: 'desc' } },
      take: HARD_WORDS_LIMIT,
    });

    const words = await prisma.word.findMany({ where: { id: { in: lapseSums.map((l) => l.wordId) } }, select: { id: true, en: true, uz: true } });
    const wordById = new Map(words.map((w) => [w.id, w]));

    res.json({
      hardWords: lapseSums
        .map((l) => {
          const word = wordById.get(l.wordId);
          if (!word) return null;
          return { wordId: word.id, en: word.en, kaa: word.uz, totalLapses: l._sum.lapses ?? 0 };
        })
        .filter((w): w is NonNullable<typeof w> => w !== null),
    });
  } catch (err) {
    next(err);
  }
});
