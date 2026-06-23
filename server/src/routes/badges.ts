import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

export const badgesRouter = Router();

badgesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const [badges, earned] = await Promise.all([
      prisma.badge.findMany({ orderBy: { id: 'asc' } }),
      prisma.userBadge.findMany({ where: { userId: req.userId }, select: { badgeId: true, earnedAt: true } }),
    ]);
    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

    res.json({
      badges: badges.map((b) => ({
        id: b.id,
        key: b.key,
        title: b.title,
        desc: b.desc,
        emoji: b.emoji,
        earned: earnedMap.has(b.id),
        earnedAt: earnedMap.get(b.id) ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});
