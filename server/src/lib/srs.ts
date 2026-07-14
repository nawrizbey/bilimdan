import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from 'ts-fsrs';

// A school year is the horizon (maximum_interval), retention target 90% is the
// FSRS-recommended default. enable_short_term=false keeps every reschedule on a
// whole-day scale so a word never becomes "due" again minutes after a session —
// which matches the once-a-day review queue this app is built around.
const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 180,
    enable_fuzz: true,
    enable_short_term: false,
  }),
);

export type ExerciseType =
  | 'intro'
  | 'mcq_en2kaa'
  | 'mcq_kaa2en'
  | 'listen_pick'
  | 'letter_tiles'
  | 'type_en'
  | 'dictation'
  | 'speak'
  | 'fill_blank';

/** Mirrors the SRS columns on UserWordProgress (see prisma/schema.prisma). */
export interface SrsState {
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  lastReview: Date | null;
}

function toCard(s: SrsState): Card {
  return {
    due: s.due,
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.lastReview ?? undefined,
  };
}

function fromCard(c: Card): SrsState {
  return {
    state: c.state,
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    lastReview: c.last_review ?? null,
  };
}

/** First-ever exposure to a word (the `intro` step) is treated as an initial
 * "Good" review — it seeds real FSRS stability/difficulty instead of leaving
 * the word on the zeroed createEmptyCard state until its first real retrieval. */
export function initialSrsState(now: Date): SrsState {
  const empty = createEmptyCard(now);
  const { card } = scheduler.next(empty, now, Rating.Good);
  return fromCard(card);
}

/** Runs one FSRS review. Kids can't self-grade, so correctness maps directly
 * to a rating: wrong = Again, correct = Good (no Hard/Easy). */
export function reviewWord(current: SrsState, correct: boolean, now: Date): SrsState {
  const { card } = scheduler.next(toCard(current), now, correct ? Rating.Good : Rating.Again);
  return fromCard(card);
}

/** The 0-5 mastery ladder (see TASK.md §2.1). Only called for words already at
 * level >= 1 — level 0 -> 1 happens directly on `intro`, not through here. */
export function nextLevel(current: number, correct: boolean): number {
  if (!correct) return Math.max(1, current - 1);
  return Math.min(5, current + 1);
}

/** Picks which exercise a word should use next, based on its mastery level and
 * (for level 5) whether it has already been reviewed once at that level. */
export function exerciseForLevel(level: number, state: number, rng: () => number = Math.random): ExerciseType {
  switch (level) {
    case 0:
      return 'intro';
    case 1:
      return 'mcq_en2kaa';
    case 2:
      return rng() < 0.5 ? 'mcq_kaa2en' : 'listen_pick';
    case 3:
      return 'letter_tiles';
    case 4:
      return rng() < 0.5 ? 'type_en' : 'dictation';
    default: {
      // First time reaching level 5 (still Learning/Relearning, not yet a
      // consolidated Review card) always goes through speak once.
      if (state !== State.Review) return 'speak';
      const pool: ExerciseType[] = ['fill_blank', 'type_en', 'speak', 'mcq_kaa2en'];
      return pool[Math.floor(rng() * pool.length)];
    }
  }
}
