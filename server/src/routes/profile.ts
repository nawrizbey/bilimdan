import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { serializeUser } from '../lib/serialize';
import { badRequest } from '../lib/errors';

export const profileRouter = Router();

const userInclude = { region: true, district: true, school: true } as const;
const ALLOWED_GOAL_MINUTES = [15, 20, 30, 45];

profileRouter.patch('/settings', requireAuth, async (req, res, next) => {
  try {
    const { mic, sfx, head, notify } = req.body ?? {};
    const data: Record<string, boolean> = {};
    if (typeof mic === 'boolean') data.micEnabled = mic;
    if (typeof sfx === 'boolean') data.sfxEnabled = sfx;
    if (typeof head === 'boolean') data.headEnabled = head;
    if (typeof notify === 'boolean') data.notifyEnabled = notify;

    const user = await prisma.user.update({ where: { id: req.userId }, data, include: userInclude });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

profileRouter.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const { goalMin } = req.body ?? {};
    if (!ALLOWED_GOAL_MINUTES.includes(Number(goalMin))) {
      throw badRequest("Kunlik maqsad qiymati noto'g'ri");
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { goalMin: Number(goalMin) },
      include: userInclude,
    });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});
