import { Router } from 'express';
import { prisma } from '../db';

export const locationsRouter = Router();

locationsRouter.get('/', async (_req, res, next) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { id: 'asc' },
      include: {
        districts: {
          orderBy: { id: 'asc' },
          include: { schools: { orderBy: { id: 'asc' } } },
        },
      },
    });
    res.json({ regions });
  } catch (err) {
    next(err);
  }
});
