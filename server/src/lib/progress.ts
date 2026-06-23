import { prisma } from '../db';
import { serializeUser } from './serialize';
import { checkAndAwardBadges } from './badges';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isYesterday(a: Date, b: Date): boolean {
  const d = new Date(b);
  d.setDate(d.getDate() - 1);
  return isSameDay(a, d);
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
 * this session's minutes/XP, and persists. Returns the updated serialized user. */
export async function awardProgress(
  userId: number,
  { minutes = 0, xpGain = 0, extra = {} }: { minutes?: number; xpGain?: number; extra?: Record<string, { increment: number }> },
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const baseline = rolloverBaseline(user.lastActiveDate, user.streak, user.goalDoneToday);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: user.xp + xpGain,
      streak: baseline.streak,
      goalDoneToday: Math.min(baseline.goalDoneToday + minutes, 300),
      lastActiveDate: new Date(),
      ...extra,
    },
    include: userInclude,
  });

  await checkAndAwardBadges(userId);

  return serializeUser(updated);
}
