import { prisma } from '../db';
import { serializeUser } from './serialize';
import { checkAndAwardBadges } from './badges';

// Uzbekistan is UTC+5 with no DST — shift into that timezone before any
// calendar-day comparison so that midnight boundaries match what the student
// experiences, not what the UTC clock shows on the server.
const UZ_OFFSET_MS = 5 * 60 * 60 * 1000;

export function uzDay(date: Date) {
  const shifted = new Date(date.getTime() + UZ_OFFSET_MS);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth(), d: shifted.getUTCDate() };
}

function isSameDay(a: Date, b: Date): boolean {
  const da = uzDay(a);
  const db = uzDay(b);
  return da.y === db.y && da.m === db.m && da.d === db.d;
}

function isYesterday(a: Date, b: Date): boolean {
  return isSameDay(a, new Date(b.getTime() - 24 * 60 * 60 * 1000));
}

/** Computes the streak/goalDoneToday baseline for "now", rolling over if the last
 * activity was not today (continuing the streak if it was yesterday, resetting otherwise). */
function rolloverBaseline(lastActiveDate: Date | null, streak: number, goalDoneToday: number) {
  const now = new Date();
  if (!lastActiveDate) return { streak: 1, goalDoneToday: 0 };
  if (isSameDay(lastActiveDate, now)) return { streak, goalDoneToday };
  if (isYesterday(lastActiveDate, now)) return { streak: streak + 1, goalDoneToday: 0 };
  return { streak: 1, goalDoneToday: 0 };
}

const userInclude = { region: true, district: true, school: true } as const;

/** Central progress-award chokepoint: applies daily streak rollover, then adds
 * this session's minutes/XP, and persists. Returns the updated serialized user.
 *
 * The read (for the rollover baseline) and write happen inside one
 * transaction, and the XP write itself is an atomic `increment` rather than
 * `current + xpGain` computed from the earlier read — otherwise two
 * near-simultaneous calls (double-tap, retry, two tabs) can race and one
 * award silently overwrites the other. */
export async function awardProgress(
  userId: number,
  { minutes = 0, xpGain = 0, extra = {} }: { minutes?: number; xpGain?: number; extra?: Record<string, { increment: number }> },
) {
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const baseline = rolloverBaseline(user.lastActiveDate, user.streak, user.goalDoneToday);

    return tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpGain },
        streak: baseline.streak,
        goalDoneToday: Math.min(baseline.goalDoneToday + minutes, 300),
        lastActiveDate: new Date(),
        ...extra,
      },
      include: userInclude,
    });
  });

  await checkAndAwardBadges(userId);

  return serializeUser(updated);
}
