import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { badRequest } from '../lib/errors';
import type { Prisma } from '@prisma/client';

export const leaderboardRouter = Router();

type Scope = 'school' | 'district' | 'region' | 'republic';
const SCOPES: Scope[] = ['school', 'district', 'region', 'republic'];

function scopeWhere(scope: Scope, me: { schoolId: number; districtId: number; regionId: number }): Prisma.UserWhereInput {
  if (scope === 'school') return { schoolId: me.schoolId };
  if (scope === 'district') return { districtId: me.districtId };
  if (scope === 'region') return { regionId: me.regionId };
  return {};
}

function displayName(fullName: string, isMe: boolean): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? fullName;
  if (isMe) return `${first} (siz)`;
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1].charAt(0).toUpperCase()}.` : '';
  return lastInitial ? `${first} ${lastInitial}` : first;
}

leaderboardRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const scope = req.query.scope;
    if (typeof scope !== 'string' || !SCOPES.includes(scope as Scope)) {
      throw badRequest("scope parametri noto'g'ri");
    }
    const typedScope = scope as Scope;

    const me = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      include: { region: true, district: true, school: true },
    });

    const ranks: Record<Scope, number> = { school: 0, district: 0, region: 0, republic: 0 };
    for (const s of SCOPES) {
      const where = scopeWhere(s, me);
      const higherCount = await prisma.user.count({ where: { ...where, xp: { gt: me.xp } } });
      ranks[s] = higherCount + 1;
    }

    const where = scopeWhere(typedScope, me);
    const boardUsers = await prisma.user.findMany({
      where,
      orderBy: { xp: 'desc' },
      take: 50,
      select: { id: true, fullName: true, xp: true, wordsKnownCount: true },
    });

    const board = boardUsers.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      isMe: u.id === me.id,
      name: displayName(u.fullName, u.id === me.id),
      initial: u.fullName.trim().charAt(0).toUpperCase(),
      xp: u.xp,
      words: u.wordsKnownCount,
    }));

    const scopeLabel =
      typedScope === 'school'
        ? me.school.name
        : typedScope === 'district'
          ? me.district.name
          : typedScope === 'region'
            ? me.region.name
            : "Butun O'zbekiston";

    res.json({ scope: typedScope, scopeLabel, ranks, board });
  } catch (err) {
    next(err);
  }
});
