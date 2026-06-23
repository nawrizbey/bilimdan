import type { Badge, User } from '@prisma/client';
import { prisma } from '../db';

function statForCriteria(user: User, criteriaType: Badge['criteriaType']): number {
  switch (criteriaType) {
    case 'STREAK_GTE':
      return user.streak;
    case 'WORDS_KNOWN_GTE':
      return user.wordsKnownCount;
    case 'BATTLE_WINS_GTE':
      return user.battleWins;
    case 'SPEAK_ATTEMPTS_GTE':
      return user.speakAttemptsCount;
  }
}

/** Awards any badges the user newly qualifies for, based on their current
 * counters. Idempotent — already-earned badges are skipped. */
export async function checkAndAwardBadges(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const [badges, earned] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);
  const earnedIds = new Set(earned.map((e) => e.badgeId));

  const toAward = badges.filter(
    (b) => !earnedIds.has(b.id) && statForCriteria(user, b.criteriaType) >= b.criteriaValue,
  );
  if (toAward.length === 0) return;

  await prisma.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });
}
