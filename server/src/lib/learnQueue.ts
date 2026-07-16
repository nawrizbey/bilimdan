import { exerciseForLevel, type ExerciseType } from './srs';

export const LESSON_SIZE = 5;

/** A lesson row on the learn path is broken into these independently-playable
 * blocks, played in order. Each block drills every lesson word with exactly
 * one fixed exercise type — see BLOCK_EXERCISE. */
export type BlockKey = 'intro' | 'listen' | 'translate' | 'letters' | 'speak' | 'write';

export const BLOCK_ORDER: BlockKey[] = ['intro', 'listen', 'translate', 'letters', 'speak', 'write'];

export const BLOCK_EXERCISE: Record<BlockKey, ExerciseType> = {
  intro: 'intro',
  listen: 'listen_pick',
  translate: 'mcq_en2kaa',
  letters: 'letter_tiles',
  speak: 'speak',
  write: 'type_en',
};

export function isBlockKey(value: unknown): value is BlockKey {
  return typeof value === 'string' && (BLOCK_ORDER as string[]).includes(value);
}

export interface ProgressLite {
  level: number;
  state: number;
}

export interface QueueItem {
  wordId: number;
  exercise: ExerciseType;
}

/** Splits a unit's words (already ordered) into fixed-size lesson chunks. The
 * last chunk may be smaller than LESSON_SIZE. */
export function chunkLessons<T>(words: T[]): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < words.length; i += LESSON_SIZE) chunks.push(words.slice(i, i + LESSON_SIZE));
  return chunks;
}

// Under the old (pre-block) system, a brand-new word's very first session
// queue was always ['intro', 'mcq_en2kaa', 'letter_tiles'] — three correct
// answers landing it at level 3. Level >= 1 alone isn't a safe legacy signal
// any more: the new `intro` block also seeds level 1 on its own, after just
// one block, so a level-1 word may simply be mid-way through the new block
// flow rather than a leftover from the old one.
const LEGACY_LESSON_LEVEL = 3;

function isLegacyLessonComplete(lessonWordIds: number[], progressMap: Map<number, ProgressLite | undefined>): boolean {
  return lessonWordIds.length > 0 && lessonWordIds.every((id) => (progressMap.get(id)?.level ?? 0) >= LEGACY_LESSON_LEVEL);
}

export interface UnitInput {
  id: number;
  title: string;
  emoji: string;
  order: number;
  wordIds: number[];
}

export interface LearnBlockStatus {
  key: BlockKey;
  done: boolean;
  locked: boolean;
}

export interface LessonStatus {
  index: number;
  wordsCount: number;
  complete: boolean;
  blocks: LearnBlockStatus[];
}

export interface UnitStatus {
  id: number;
  title: string;
  emoji: string;
  order: number;
  wordsCount: number;
  lessons: LessonStatus[];
  complete: boolean;
  locked: boolean;
}

export function blockProgressMapKey(unitId: number, lessonIndex: number): string {
  return `${unitId}-${lessonIndex}`;
}

/** Computes per-block done/locked state for one lesson. Blocks unlock in
 * BLOCK_ORDER sequence, one at a time. Lessons finished under the old
 * (pre-block) single-session system have every word at level >= 1 but no
 * LearnBlockProgress rows — those are backfilled as fully done so returning
 * students aren't forced to replay lessons they already finished.
 *
 * The backfill only fires when `doneBlocks` is still empty. Without that
 * guard, a student actively playing a *fresh* lesson through the real block
 * system would trip it too: answering blocks 1-3 correctly alone pushes a
 * word's level to 3 (intro:0→1, +1 per correct block after), so
 * `isLegacyLessonComplete` could go true mid-lesson and falsely backfill
 * every later block (letters/speak/write) as already done — halving their
 * XP as "practice" the first time they're genuinely played. Once any real
 * LearnBlockProgress row exists for a lesson, that recorded state is always
 * authoritative and the level-based fallback never overrides it again. */
function computeLessonBlocks(
  lessonWordIds: number[],
  doneBlocks: Set<BlockKey>,
  progressMap: Map<number, ProgressLite | undefined>,
): LearnBlockStatus[] {
  const legacyComplete = doneBlocks.size === 0 && isLegacyLessonComplete(lessonWordIds, progressMap);
  const effectiveDone = legacyComplete ? new Set(BLOCK_ORDER) : doneBlocks;
  return BLOCK_ORDER.map((key, i) => ({
    key,
    done: effectiveDone.has(key),
    locked: i > 0 && !effectiveDone.has(BLOCK_ORDER[i - 1]),
  }));
}

/** Units unlock sequentially: unit N is locked until unit N-1 is complete (first
 * unit always unlocked). A unit with no words yet (still being authored) is
 * treated as auto-complete so it never blocks the units after it — mirrors the
 * old `pickTargetUnit`'s `wordsCount > 0` filter. */
export function computeUnitsStatus(
  units: UnitInput[],
  progressMap: Map<number, ProgressLite | undefined>,
  blockProgressMap: Map<string, Set<BlockKey>> = new Map(),
): UnitStatus[] {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const result: UnitStatus[] = [];
  let previousComplete = true;

  for (const unit of sorted) {
    const lessonChunks = chunkLessons(unit.wordIds);
    const lessons: LessonStatus[] = lessonChunks.map((ids, index) => {
      const doneBlocks = blockProgressMap.get(blockProgressMapKey(unit.id, index)) ?? new Set<BlockKey>();
      const blocks = computeLessonBlocks(ids, doneBlocks, progressMap);
      return {
        index,
        wordsCount: ids.length,
        complete: blocks.every((b) => b.done),
        blocks,
      };
    });
    const complete = unit.wordIds.length === 0 || lessons.every((l) => l.complete);
    const locked = !previousComplete;

    result.push({
      id: unit.id,
      title: unit.title,
      emoji: unit.emoji,
      order: unit.order,
      wordsCount: unit.wordIds.length,
      lessons,
      complete,
      locked,
    });
    previousComplete = complete;
  }

  return result;
}

/** A lesson is startable if its unit isn't locked and every earlier lesson in
 * that unit is already complete (no skipping ahead within a unit). */
export function isLessonStartable(unit: UnitStatus, lessonIndex: number): boolean {
  if (unit.locked) return false;
  const lesson = unit.lessons[lessonIndex];
  if (!lesson) return false;
  if (lessonIndex === 0) return true;
  return unit.lessons[lessonIndex - 1].complete;
}

/** A block is startable if its lesson row is reachable and the block itself
 * isn't locked (i.e. every earlier block in BLOCK_ORDER is already done). */
export function isBlockStartable(unit: UnitStatus, lessonIndex: number, block: BlockKey): boolean {
  if (!isLessonStartable(unit, lessonIndex)) return false;
  const status = unit.lessons[lessonIndex].blocks.find((b) => b.key === block);
  return !!status && !status.locked;
}

/** Builds a block session queue: every word in the lesson gets exactly one
 * exercise, of the fixed type for `block` (see BLOCK_EXERCISE). Unlike the
 * old adaptive per-word selection, the block itself determines the exercise
 * type — mastery level only drives the FSRS due date, not which block is
 * playable next. */
export function buildBlockQueue(lessonWordIds: number[], block: BlockKey): QueueItem[] {
  const exercise = BLOCK_EXERCISE[block];
  return lessonWordIds.map((wordId) => ({ wordId, exercise }));
}

/** Builds a pure review-session queue: one exercise per due word, ordered by
 * due date (the order the caller passes wordIds in). */
export function buildReviewQueue(
  dueWordIds: number[],
  progressMap: Map<number, ProgressLite>,
  rng: () => number = Math.random,
): QueueItem[] {
  return dueWordIds.map((wordId) => {
    const p = progressMap.get(wordId)!;
    return { wordId, exercise: exerciseForLevel(p.level, p.state, rng) };
  });
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds 4 multiple-choice options for `word[field]`, drawing distractors from
 * the same unit first and padding from the global word pool if the unit is too
 * small. `field` is 'en' for English-answer exercises (mcq_kaa2en, listen_pick,
 * fill_blank) or 'uz' (the Karakalpak column) for mcq_en2kaa. */
export function buildOptions<W extends { id: number; en: string; uz: string }>(
  word: W,
  unitWords: W[],
  allWords: W[],
  field: 'en' | 'uz',
  rng: () => number = Math.random,
): { options: string[]; correctIndex: number } {
  const correct = word[field];
  const seen = new Set([correct]);

  const fromUnit = shuffle(
    unitWords.filter((w) => w.id !== word.id && !seen.has(w[field])),
    rng,
  );
  const distractors: string[] = [];
  for (const w of fromUnit) {
    if (distractors.length >= 3) break;
    if (seen.has(w[field])) continue;
    distractors.push(w[field]);
    seen.add(w[field]);
  }

  if (distractors.length < 3) {
    const fromGlobal = shuffle(
      allWords.filter((w) => w.id !== word.id && !seen.has(w[field])),
      rng,
    );
    for (const w of fromGlobal) {
      if (distractors.length >= 3) break;
      distractors.push(w[field]);
      seen.add(w[field]);
    }
  }

  const options = shuffle([...distractors, correct], rng);
  return { options, correctIndex: options.indexOf(correct) };
}
