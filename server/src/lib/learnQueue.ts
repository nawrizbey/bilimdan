import { exerciseForLevel, type ExerciseType } from './srs';

export const LESSON_SIZE = 5;

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

export function isLessonComplete(lessonWordIds: number[], progressMap: Map<number, ProgressLite | undefined>): boolean {
  return lessonWordIds.length > 0 && lessonWordIds.every((id) => (progressMap.get(id)?.level ?? 0) >= 1);
}

export interface UnitInput {
  id: number;
  title: string;
  emoji: string;
  order: number;
  wordIds: number[];
}

export interface LessonStatus {
  index: number;
  wordsCount: number;
  complete: boolean;
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

/** Units unlock sequentially: unit N is locked until unit N-1 is complete (first
 * unit always unlocked). A unit with no words yet (still being authored) is
 * treated as auto-complete so it never blocks the units after it — mirrors the
 * old `pickTargetUnit`'s `wordsCount > 0` filter. */
export function computeUnitsStatus(units: UnitInput[], progressMap: Map<number, ProgressLite | undefined>): UnitStatus[] {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const result: UnitStatus[] = [];
  let previousComplete = true;

  for (const unit of sorted) {
    const lessonChunks = chunkLessons(unit.wordIds);
    const lessons: LessonStatus[] = lessonChunks.map((ids, index) => ({
      index,
      wordsCount: ids.length,
      complete: isLessonComplete(ids, progressMap),
    }));
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

interface Track {
  wordId: number;
  steps: ExerciseType[];
  cursor: number;
  lastPlacedAt: number;
  orderHint: number;
}

/** Interleaves several words' exercise steps so the same word never appears
 * twice in a row and, where possible, its steps are spaced >= minGap positions
 * apart. Falls back to placing whatever's left once spacing can't be honored
 * (e.g. only one word has steps remaining at the tail of the queue).
 *
 * Picking randomly among all eligible tracks (rather than always the
 * least-recently-placed one) matters here: with several tracks of identical
 * length starting at the same time, a deterministic least-recently-used pick
 * lockisteps them — every track finishes its 1st step before any starts its
 * 2nd, producing "all intros, then all mcqs, then all tiles" instead of a
 * genuine mix of exercise types. */
function interleave(tracks: Track[], minGap = 2, rng: () => number = Math.random): QueueItem[] {
  const result: QueueItem[] = [];
  let pos = 0;

  const hasRemaining = () => tracks.some((t) => t.cursor < t.steps.length);
  while (hasRemaining()) {
    let eligible = tracks.filter((t) => t.cursor < t.steps.length && pos - t.lastPlacedAt >= minGap);
    let track: Track;
    if (eligible.length > 0) {
      track = eligible[Math.floor(rng() * eligible.length)];
    } else {
      // Nothing has waited long enough — take whichever remaining track has
      // waited the longest, so the queue still makes progress.
      eligible = tracks.filter((t) => t.cursor < t.steps.length);
      eligible.sort((a, b) => a.lastPlacedAt - b.lastPlacedAt || a.orderHint - b.orderHint);
      track = eligible[0];
    }

    result.push({ wordId: track.wordId, exercise: track.steps[track.cursor] });
    track.cursor += 1;
    track.lastPlacedAt = pos;
    pos += 1;
  }

  return result;
}

/** Builds a lesson session queue: each new word (level 0) gets an intro plus two
 * retrievals; each already-started word in the lesson gets one exercise for its
 * current level; up to a handful of due review words (from any unit) are mixed
 * in. See TASK.md §2.5. */
export function buildLessonQueue(
  lessonWordIds: number[],
  dueReviewWordIds: number[],
  progressMap: Map<number, ProgressLite | undefined>,
  rng: () => number = Math.random,
): QueueItem[] {
  const tracks: Track[] = [];
  let orderHint = 0;

  for (const wordId of lessonWordIds) {
    const p = progressMap.get(wordId);
    const level = p?.level ?? 0;
    const steps: ExerciseType[] =
      level === 0 ? ['intro', 'mcq_en2kaa', 'letter_tiles'] : [exerciseForLevel(level, p!.state, rng)];
    tracks.push({ wordId, steps, cursor: 0, lastPlacedAt: -Infinity, orderHint: orderHint++ });
  }

  for (const wordId of dueReviewWordIds) {
    const p = progressMap.get(wordId);
    const level = p?.level ?? 1;
    const state = p?.state ?? 0;
    tracks.push({ wordId, steps: [exerciseForLevel(level, state, rng)], cursor: 0, lastPlacedAt: -Infinity, orderHint: orderHint++ });
  }

  return interleave(tracks, 2, rng);
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
