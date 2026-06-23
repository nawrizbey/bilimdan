import type { LearnPhase, TestQuestion } from '../store/useAppStore';

const STORAGE_KEY = 'bilimdon_learn_session';

export interface LearnSessionSnapshot {
  currentUnitId: number;
  learnPhase: LearnPhase;
  card: number;
  familiarizeViewed: number[];
  writeIdx: number;
  writeCorrectCount: number;
  writeMissedWords: string[];
  learnSpeakIdx: number;
  testQuestions: TestQuestion[];
  testIdx: number;
  testCorrectCount: number;
}

/** Persists just enough of an in-progress learn session (which unit, which phase,
 * how far in) to sessionStorage, so an accidental page refresh resumes instead of
 * wiping out a student's progress. Transient bits (typed-but-unsubmitted input,
 * a currently-selected-but-unrevealed test answer) are intentionally not saved. */
export function saveLearnSession(snapshot: LearnSessionSnapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage unavailable (private mode / quota) — resume just won't work.
  }
}

export function loadLearnSession(): LearnSessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LearnSessionSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearLearnSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
