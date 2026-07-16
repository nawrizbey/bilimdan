import { prisma } from '../db';
import { awardProgress, uzDay } from './progress';

/** 'YYYY-MM-DD' in Uzbekistan local time (UTC+5) — rolls over at UZ midnight
 * regardless of server timezone, same shift `awardProgress` uses for streak
 * rollover. */
export function uzDateKey(date: Date): string {
  const { y, m, d } = uzDay(date);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const QUEST_TARGETS = {
  blocks: { target: 3, xp: 10 },
  newWords: { target: 2, xp: 10 },
  correct: { target: 20, xp: 15 },
} as const;

export type QuestKey = keyof typeof QUEST_TARGETS;

/** Awards a quest's XP exactly once by flipping its `*Claimed` flag via a
 * single conditional UPDATE (`WHERE ...Claimed = false AND ...Count >=
 * target`) — the DB-level atomicity is what makes this race-safe, not a
 * read-then-write check, so two concurrent requests crossing the threshold
 * at the same moment can't both award XP. */
async function claimBlocksIfDue(userId: number, dateKey: string) {
  const result = await prisma.dailyQuestProgress.updateMany({
    where: { userId, dateKey, blocksClaimed: false, blocksCount: { gte: QUEST_TARGETS.blocks.target } },
    data: { blocksClaimed: true },
  });
  if (result.count > 0) await awardProgress(userId, { xpGain: QUEST_TARGETS.blocks.xp });
}

async function claimNewWordsIfDue(userId: number, dateKey: string) {
  const result = await prisma.dailyQuestProgress.updateMany({
    where: { userId, dateKey, newWordsClaimed: false, newWordsCount: { gte: QUEST_TARGETS.newWords.target } },
    data: { newWordsClaimed: true },
  });
  if (result.count > 0) await awardProgress(userId, { xpGain: QUEST_TARGETS.newWords.xp });
}

async function claimCorrectIfDue(userId: number, dateKey: string) {
  const result = await prisma.dailyQuestProgress.updateMany({
    where: { userId, dateKey, correctClaimed: false, correctCount: { gte: QUEST_TARGETS.correct.target } },
    data: { correctClaimed: true },
  });
  if (result.count > 0) await awardProgress(userId, { xpGain: QUEST_TARGETS.correct.xp });
}

/** Quest ①: completing a learn block (any block, any lesson) — called once
 * per fresh (non-replay) lesson-session completion in /session-complete. */
export async function recordBlockCompleted(userId: number, now = new Date()): Promise<void> {
  const dateKey = uzDateKey(now);
  await prisma.dailyQuestProgress.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    create: { userId, dateKey, blocksCount: 1 },
    update: { blocksCount: { increment: 1 } },
  });
  await claimBlocksIfDue(userId, dateKey);
}

/** Quest ②: a word crossing the "known" mastery threshold — called from
 * /answer whenever `newlyKnown` is true. */
export async function recordNewWordLearned(userId: number, now = new Date()): Promise<void> {
  const dateKey = uzDateKey(now);
  await prisma.dailyQuestProgress.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    create: { userId, dateKey, newWordsCount: 1 },
    update: { newWordsCount: { increment: 1 } },
  });
  await claimNewWordsIfDue(userId, dateKey);
}

/** Quest ③: any graded (non-intro, non-practice, non-replay) correct answer
 * — called from /answer. */
export async function recordCorrectAnswer(userId: number, now = new Date()): Promise<void> {
  const dateKey = uzDateKey(now);
  await prisma.dailyQuestProgress.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    create: { userId, dateKey, correctCount: 1 },
    update: { correctCount: { increment: 1 } },
  });
  await claimCorrectIfDue(userId, dateKey);
}

export interface TodayQuest {
  key: QuestKey;
  current: number;
  target: number;
  done: boolean;
  xp: number;
}

export async function getTodayQuests(userId: number, now = new Date()): Promise<TodayQuest[]> {
  const dateKey = uzDateKey(now);
  const row = await prisma.dailyQuestProgress.findUnique({ where: { userId_dateKey: { userId, dateKey } } });
  return [
    {
      key: 'blocks',
      current: Math.min(row?.blocksCount ?? 0, QUEST_TARGETS.blocks.target),
      target: QUEST_TARGETS.blocks.target,
      done: row?.blocksClaimed ?? false,
      xp: QUEST_TARGETS.blocks.xp,
    },
    {
      key: 'newWords',
      current: Math.min(row?.newWordsCount ?? 0, QUEST_TARGETS.newWords.target),
      target: QUEST_TARGETS.newWords.target,
      done: row?.newWordsClaimed ?? false,
      xp: QUEST_TARGETS.newWords.xp,
    },
    {
      key: 'correct',
      current: Math.min(row?.correctCount ?? 0, QUEST_TARGETS.correct.target),
      target: QUEST_TARGETS.correct.target,
      done: row?.correctClaimed ?? false,
      xp: QUEST_TARGETS.correct.xp,
    },
  ];
}
