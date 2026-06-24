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

// Returns the bare display name only — no "(siz)"/"you" suffix, since that's
// locale text. The frontend already gets `isMe` per board entry and appends its
// own translated suffix when rendering.
function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? fullName;
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

    const rankEntries = await Promise.all(
      SCOPES.map(async (s) => {
        const where = scopeWhere(s, me);
        const higherCount = await prisma.user.count({ where: { ...where, xp: { gt: me.xp } } });
        return [s, higherCount + 1] as const;
      }),
    );
    const ranks = Object.fromEntries(rankEntries) as Record<Scope, number>;

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
      name: displayName(u.fullName),
      initial: u.fullName.trim().charAt(0).toUpperCase(),
      xp: u.xp,
      words: u.wordsKnownCount,
    }));

    // 'republic' has no place-name to look up — the frontend supplies its own
    // translated label for that scope instead of using this field.
    const scopeLabel =
      typedScope === 'school' ? me.school.name : typedScope === 'district' ? me.district.name : typedScope === 'region' ? me.region.name : '';

    res.json({ scope: typedScope, scopeLabel, ranks, board });
  } catch (err) {
    next(err);
  }
});
