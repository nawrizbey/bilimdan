import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { badRequest, notFound } from '../lib/errors';

export const classesRouter = Router();

classesRouter.use(requireAuth);

classesRouter.post('/join', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const { code } = req.body ?? {};
    if (typeof code !== 'string' || !code.trim()) throw badRequest('Kod kiritilmegen');

    const cls = await prisma.class.findUnique({ where: { joinCode: code.trim().toUpperCase() } });
    if (!cls) throw notFound('Bunday kod menen klass tabılmadı');

    await prisma.classMember.upsert({
      where: { classId_userId: { classId: cls.id, userId } },
      update: {},
      create: { classId: cls.id, userId },
    });

    res.json({ className: cls.name });
  } catch (err) {
    next(err);
  }
});
