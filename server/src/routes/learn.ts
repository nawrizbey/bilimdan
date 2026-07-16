import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { awardProgress } from '../lib/progress';
import { serializeUser } from '../lib/serialize';
import { badRequest, notFound } from '../lib/errors';
import { initialSrsState, nextLevel, reviewWord, type SrsState } from '../lib/srs';
import { gradeTypedAnswer } from '../lib/typing';
import {
  blockProgressMapKey,
  buildBlockQueue,
  buildOptions,
  buildReviewQueue,
  computeUnitsStatus,
  isBlockKey,
  isBlockStartable,
  type BlockKey,
  type ProgressLite,
  type QueueItem,
  type UnitInput,
} from '../lib/learnQueue';

export const learnRouter = Router();

const REVIEW_BATCH_SIZE = 15;
const SESSION_MINUTES_CAP = 20;
const KNOWN_AT_LEVEL = 3;

const XP_TABLE: Record<string, number> = {
  intro: 0,
  mcq_en2kaa: 2,
  mcq_kaa2en: 2,
  listen_pick: 2,
  fill_blank: 2,
  letter_tiles: 3,
  type_en: 3,
  dictation: 3,
  speak: 3,
};

type WordRow = { id: number; unitId: number; en: string; ipa: string; uz: string; example: string; emoji: string };
type AnsweredEntry = { wordId: number; exercise: string; correct: boolean; responseMs: number; newlyKnown: boolean };

/** What actually gets persisted in `LearnSession.items` — includes the
 * server's private answer key (`options`/`correctIndex`) for MCQ-family
 * items, computed once at session-start so it stays stable for the whole
 * session (resume, grading, idempotent replay all read the same values). */
type StoredItem = QueueItem & { options?: string[]; correctIndex?: number };

const MCQ_EXERCISES = new Set(['mcq_en2kaa', 'mcq_kaa2en', 'listen_pick', 'fill_blank']);
// letter_tiles is exact-match only — the tile set is the exact right letters
// plus a few decoys, so there's no keyboard-typo concept to tolerate there.
const TYPO_TOLERANT_EXERCISES = new Set(['type_en', 'dictation']);
const EXACT_TYPING_EXERCISES = new Set(['letter_tiles']);

function publicWord(w: WordRow) {
  return { id: w.id, en: w.en, ipa: w.ipa, kaa: w.uz, example: w.example, emoji: w.emoji };
}

/** Computes options + the correct answer index for MCQ-family items. This is
 * the answer key — it must never be sent to the client before grading. */
function buildStoredItems(items: QueueItem[], allWords: WordRow[]): StoredItem[] {
  const byId = new Map(allWords.map((w) => [w.id, w]));
  return items.map((item) => {
    const word = byId.get(item.wordId)!;
    const unitWords = allWords.filter((w) => w.unitId === word.unitId);
    switch (item.exercise) {
      case 'mcq_en2kaa': {
        const { options, correctIndex } = buildOptions(word, unitWords, allWords, 'uz');
        return { wordId: item.wordId, exercise: item.exercise, options, correctIndex };
      }
      case 'mcq_kaa2en':
      case 'listen_pick':
      case 'fill_blank': {
        const { options, correctIndex } = buildOptions(word, unitWords, allWords, 'en');
        return { wordId: item.wordId, exercise: item.exercise, options, correctIndex };
      }
      default:
        return { wordId: item.wordId, exercise: item.exercise };
    }
  });
}

/** Formats stored items for the client: attaches the word payload and keeps
 * `options` (needed to render the choices), but strips `correctIndex` — the
 * server alone knows the answer key until `/answer` grades an attempt. */
function toPublicItems(storedItems: StoredItem[], allWords: WordRow[]) {
  const byId = new Map(allWords.map((w) => [w.id, w]));
  return storedItems.map((item) => {
    const word = byId.get(item.wordId)!;
    return { wordId: item.wordId, exercise: item.exercise, word: publicWord(word), options: item.options };
  });
}

async function fetchUnitsStatus(userId: number) {
  const units = await prisma.unit.findMany({
    orderBy: { order: 'asc' },
    include: { words: { select: { id: true }, orderBy: { order: 'asc' } } },
  });
  const wordIds = units.flatMap((u) => u.words.map((w) => w.id));
  const progress = await prisma.userWordProgress.findMany({
    where: { userId, wordId: { in: wordIds } },
    select: { wordId: true, level: true, state: true },
  });
  const progressMap = new Map<number, ProgressLite>(progress.map((p) => [p.wordId, { level: p.level, state: p.state }]));

  const blockRows = await prisma.learnBlockProgress.findMany({
    where: { userId },
    select: { unitId: true, lessonIndex: true, block: true },
  });
  const blockProgressMap = new Map<string, Set<BlockKey>>();
  for (const row of blockRows) {
    const key = blockProgressMapKey(row.unitId, row.lessonIndex);
    if (!isBlockKey(row.block)) continue;
    const set = blockProgressMap.get(key) ?? new Set<BlockKey>();
    set.add(row.block);
    blockProgressMap.set(key, set);
  }

  const unitInputs: UnitInput[] = units.map((u) => ({
    id: u.id,
    title: u.title,
    emoji: u.emoji,
    order: u.order,
    wordIds: u.words.map((w) => w.id),
  }));

  return { statuses: computeUnitsStatus(unitInputs, progressMap, blockProgressMap), progressMap };
}

learnRouter.get('/path', requireAuth, async (req, res, next) => {
  try {
    const { statuses } = await fetchUnitsStatus(req.userId!);
    const dueCount = await prisma.userWordProgress.count({
      where: { userId: req.userId!, level: { gte: 1 }, due: { lte: new Date() } },
    });

    res.json({
      dueCount,
      units: statuses
        .filter((u) => u.wordsCount > 0)
        .map((u) => ({
          id: u.id,
          title: u.title,
          emoji: u.emoji,
          order: u.order,
          wordsCount: u.wordsCount,
          lessons: u.lessons,
          complete: u.complete,
          locked: u.locked,
        })),
    });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/session-start', requireAuth, rateLimit(15, 60_000), async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const { type } = req.body ?? {};
    if (type !== 'lesson' && type !== 'review') throw badRequest("Sessiya túri qáte");

    // Only one session may be in flight at a time — starting a new one abandons
    // whatever was left unfinished, so the student always gets a clean slate.
    await prisma.learnSession.updateMany({
      where: { userId, completedAt: null },
      data: { completedAt: now },
    });

    if (type === 'lesson') {
      const unitId = Number(req.body?.unitId);
      const lessonIndex = Number(req.body?.lessonIndex);
      const block = req.body?.block;
      if (!unitId || !Number.isInteger(lessonIndex) || lessonIndex < 0) throw badRequest("Sabaq kórsetilmegen");
      if (!isBlockKey(block)) throw badRequest('Blok kórsetilmegen');

      const { statuses } = await fetchUnitsStatus(userId);
      const unitStatus = statuses.find((u) => u.id === unitId);
      if (!unitStatus) throw notFound('Tema tabılmadı');
      if (!isBlockStartable(unitStatus, lessonIndex, block)) throw badRequest('Bul blok ele qulıplanǵan');

      const unitWords = await prisma.word.findMany({ where: { unitId }, orderBy: { order: 'asc' } });
      const lessonWordIds = unitWords.slice(lessonIndex * 5, lessonIndex * 5 + 5).map((w) => w.id);
      const isPractice = unitStatus.lessons[lessonIndex].blocks.find((b) => b.key === block)?.done ?? false;

      const items = buildBlockQueue(lessonWordIds, block);
      const allWords = await prisma.word.findMany();
      const storedItems = buildStoredItems(items, allWords);

      const session = await prisma.learnSession.create({
        data: {
          userId,
          type: 'lesson',
          unitId,
          lessonIndex,
          block,
          isPractice,
          items: storedItems as unknown as Prisma.InputJsonValue,
          answered: [],
        },
      });

      res.json({
        sessionId: session.id,
        type: 'lesson',
        unit: { id: unitId, title: unitStatus.title, emoji: unitStatus.emoji },
        items: toPublicItems(storedItems, allWords),
      });
      return;
    }

    // type === 'review'
    const dueRows = await prisma.userWordProgress.findMany({
      where: { userId, due: { lte: now } },
      orderBy: { due: 'asc' },
      take: REVIEW_BATCH_SIZE,
      select: { wordId: true, level: true, state: true },
    });
    if (dueRows.length === 0) throw badRequest('Búgin qaytalaw joq', 'NO_REVIEWS_DUE');

    const progressMap = new Map<number, ProgressLite>(dueRows.map((r) => [r.wordId, { level: r.level, state: r.state }]));
    const items = buildReviewQueue(dueRows.map((r) => r.wordId), progressMap);
    const allWords = await prisma.word.findMany();
    const storedItems = buildStoredItems(items, allWords);

    const session = await prisma.learnSession.create({
      data: { userId, type: 'review', unitId: null, lessonIndex: null, items: storedItems as unknown as Prisma.InputJsonValue, answered: [] },
    });

    res.json({
      sessionId: session.id,
      type: 'review',
      unit: null,
      items: toPublicItems(storedItems, allWords),
    });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/answer', requireAuth, rateLimit(120, 60_000), async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const { sessionId, wordId, exercise, answerIndex, answerText, correct: clientCorrect, responseMs, practice } = req.body ?? {};
    const sessionIdNum = Number(sessionId);
    const wordIdNum = Number(wordId);
    if (!sessionIdNum || !wordIdNum || typeof exercise !== 'string') {
      throw badRequest('Juwap maǵlıwmatları qáte');
    }

    const session = await prisma.learnSession.findUnique({ where: { id: sessionIdNum } });
    if (!session || session.userId !== userId) throw notFound('Sessiya tabılmadı');
    if (session.completedAt) throw badRequest('Bul sessiya juwmaqlanǵan');

    const storedItems = session.items as unknown as StoredItem[];
    const storedItem = storedItems.find((i) => i.wordId === wordIdNum && i.exercise === exercise);
    if (!storedItem) throw badRequest('Bul mashq bul sessiyaǵa tiyisli emes');

    // Grades the attempt on the server — never trusts a client-claimed
    // boolean, except for `speak`, which can't be verified without
    // server-side audio (mic scoring is inherently client-side).
    let correct: boolean;
    let almost = false;
    if (exercise === 'intro') {
      correct = true;
    } else if (MCQ_EXERCISES.has(exercise)) {
      const answerIndexNum = Number(answerIndex);
      if (!Number.isInteger(answerIndexNum)) throw badRequest('Juwap maǵlıwmatları qáte');
      correct = answerIndexNum === storedItem.correctIndex;
    } else if (TYPO_TOLERANT_EXERCISES.has(exercise)) {
      if (typeof answerText !== 'string') throw badRequest('Juwap maǵlıwmatları qáte');
      const word = await prisma.word.findUnique({ where: { id: wordIdNum }, select: { en: true } });
      if (!word) throw notFound('Sóz tabılmadı');
      const graded = gradeTypedAnswer(answerText, word.en);
      correct = graded.correct;
      almost = graded.almost;
    } else if (EXACT_TYPING_EXERCISES.has(exercise)) {
      if (typeof answerText !== 'string') throw badRequest('Juwap maǵlıwmatları qáte');
      const word = await prisma.word.findUnique({ where: { id: wordIdNum }, select: { en: true } });
      if (!word) throw notFound('Sóz tabılmadı');
      correct = answerText.trim().toLowerCase() === word.en.trim().toLowerCase();
    } else if (exercise === 'speak') {
      if (typeof clientCorrect !== 'boolean') throw badRequest('Juwap maǵlıwmatları qáte');
      correct = clientCorrect;
    } else {
      throw badRequest('Bilinbegen mashq túri');
    }

    // Practice attempts — re-queued repeats after a miss — are graded the
    // same way for immediate UI feedback, but never touch FSRS/mastery or
    // the session's answer log. Only the first real attempt at a
    // (wordId, exercise) pair counts.
    if (practice === true) {
      res.json({ correct, correctIndex: storedItem.correctIndex, almost });
      return;
    }

    const answered = session.answered as unknown as AnsweredEntry[];
    const already = answered.find((a) => a.wordId === wordIdNum && a.exercise === exercise);
    if (already) {
      // Idempotent replay (e.g. a retried network request) — don't re-run FSRS.
      const progress = await prisma.userWordProgress.findUnique({ where: { userId_wordId: { userId, wordId: wordIdNum } } });
      res.json({ level: progress?.level ?? 0, due: progress?.due ?? now, correct: already.correct, correctIndex: storedItem.correctIndex, almost });
      return;
    }

    const existing = await prisma.userWordProgress.findUnique({ where: { userId_wordId: { userId, wordId: wordIdNum } } });
    let level: number;
    let srs: SrsState;
    let newlyKnown = false;
    let known = existing?.known ?? false;
    let knownAt = existing?.knownAt ?? null;

    if (exercise === 'intro' || !existing) {
      // First-ever exposure: the intro step (or, defensively, any exercise that
      // somehow arrives before a progress row exists) seeds the word at level 1.
      level = 1;
      srs = initialSrsState(now);
    } else {
      level = nextLevel(existing.level, correct);
      srs = reviewWord(
        {
          state: existing.state,
          due: existing.due,
          stability: existing.stability,
          difficulty: existing.difficulty,
          elapsedDays: existing.elapsedDays,
          scheduledDays: existing.scheduledDays,
          learningSteps: existing.learningSteps,
          reps: existing.reps,
          lapses: existing.lapses,
          lastReview: existing.lastReview,
        },
        correct,
        now,
      );
    }

    if (!known && level >= KNOWN_AT_LEVEL) {
      known = true;
      knownAt = now;
      newlyKnown = true;
    }

    await prisma.userWordProgress.upsert({
      where: { userId_wordId: { userId, wordId: wordIdNum } },
      create: {
        userId,
        wordId: wordIdNum,
        level,
        known,
        knownAt,
        state: srs.state,
        due: srs.due,
        stability: srs.stability,
        difficulty: srs.difficulty,
        elapsedDays: srs.elapsedDays,
        scheduledDays: srs.scheduledDays,
        learningSteps: srs.learningSteps,
        reps: srs.reps,
        lapses: srs.lapses,
        lastReview: srs.lastReview,
      },
      update: {
        level,
        known,
        knownAt,
        state: srs.state,
        due: srs.due,
        stability: srs.stability,
        difficulty: srs.difficulty,
        elapsedDays: srs.elapsedDays,
        scheduledDays: srs.scheduledDays,
        learningSteps: srs.learningSteps,
        reps: srs.reps,
        lapses: srs.lapses,
        lastReview: srs.lastReview,
      },
    });

    if (newlyKnown) {
      await prisma.user.update({ where: { id: userId }, data: { wordsKnownCount: { increment: 1 } } });
    }

    const entry: AnsweredEntry = {
      wordId: wordIdNum,
      exercise,
      correct,
      responseMs: Number.isFinite(Number(responseMs)) ? Number(responseMs) : 0,
      newlyKnown,
    };
    await prisma.learnSession.update({
      where: { id: sessionIdNum },
      data: { answered: [...answered, entry] },
    });

    res.json({ level, due: srs.due, correct, correctIndex: storedItem.correctIndex, almost });
  } catch (err) {
    next(err);
  }
});

learnRouter.get('/session-active', requireAuth, async (req, res, next) => {
  try {
    const session = await prisma.learnSession.findFirst({
      where: { userId: req.userId!, completedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) {
      res.json({ session: null });
      return;
    }

    const storedItems = session.items as unknown as StoredItem[];
    const allWords = await prisma.word.findMany();
    const unit = session.unitId
      ? await prisma.unit.findUnique({ where: { id: session.unitId }, select: { id: true, title: true, emoji: true } })
      : null;

    res.json({
      sessionId: session.id,
      type: session.type,
      unit,
      items: toPublicItems(storedItems, allWords),
      answered: session.answered,
    });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/session-complete', requireAuth, rateLimit(15, 60_000), async (req, res, next) => {
  try {
    const userId = req.userId!;
    const sessionIdNum = Number(req.body?.sessionId);
    if (!sessionIdNum) throw badRequest('Sessiya kórsetilmegen');

    const session = await prisma.learnSession.findUnique({ where: { id: sessionIdNum } });
    if (!session || session.userId !== userId) throw notFound('Sessiya tabılmadı');

    const items = session.items as unknown as QueueItem[];
    const answered = session.answered as unknown as AnsweredEntry[];
    const graded = answered.filter((a) => a.exercise !== 'intro');
    const correctCount = graded.filter((a) => a.correct).length;
    const itemsTotal = items.filter((i) => i.exercise !== 'intro').length;
    const newWordsLearned = answered.filter((a) => a.newlyKnown).length;

    if (session.completedAt) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { region: true, district: true, school: true },
      });
      res.json({
        user: serializeUser(user),
        xpGained: session.xpAwarded,
        correctCount,
        itemsTotal,
        newWordsLearned,
      });
      return;
    }

    let xpGain = answered.reduce((sum, a) => (a.correct ? sum + (XP_TABLE[a.exercise] ?? 0) : sum), 0);
    if (session.type === 'lesson' && session.isPractice) {
      xpGain = Math.round(xpGain / 2);
    } else if (session.type === 'lesson' && session.block === 'write') {
      // The completion bonus belongs to finishing the whole lesson row, not
      // any single block — 'write' is the last block in BLOCK_ORDER, so
      // completing it means the lesson is done. Earlier blocks (intro
      // especially, which awards 0 XP per item) only earn their per-item XP.
      xpGain += 20;
    } else if (session.type === 'review') {
      xpGain += 10;
    }

    if (session.type === 'lesson' && session.block && session.unitId != null && session.lessonIndex != null) {
      await prisma.learnBlockProgress.upsert({
        where: {
          userId_unitId_lessonIndex_block: {
            userId,
            unitId: session.unitId,
            lessonIndex: session.lessonIndex,
            block: session.block,
          },
        },
        create: { userId, unitId: session.unitId, lessonIndex: session.lessonIndex, block: session.block },
        update: {},
      });
    }

    // The intro block is a pure reading step (tap through 5 word cards) —
    // counting it at the same rate as a real retrieval block would credit
    // goal-minutes for near-zero effort.
    const minutes =
      session.type === 'lesson' && session.block === 'intro'
        ? 1
        : Math.min(Math.ceil(items.length / 2), SESSION_MINUTES_CAP);
    const user = await awardProgress(userId, { minutes, xpGain });

    await prisma.learnSession.update({
      where: { id: sessionIdNum },
      data: { completedAt: new Date(), xpAwarded: xpGain },
    });

    res.json({ user, xpGained: xpGain, correctCount, itemsTotal, newWordsLearned });
  } catch (err) {
    next(err);
  }
});
