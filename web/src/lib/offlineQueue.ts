import { postLearnAnswer } from './learnApi';
import type { ExerciseType, LearnAnswerPayload } from '../types/api';

const STORAGE_KEY = 'bilimdon_offline_answer_queue';

export interface QueuedAnswer {
  sessionId: number;
  wordId: number;
  exercise: ExerciseType;
  responseMs: number;
  practice: boolean;
  payload: LearnAnswerPayload;
}

function readQueue(): QueuedAnswer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAnswer[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAnswer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // storage unavailable (private mode, quota) — the queued answer is lost
    // on this device, which degrades to "offline attempt didn't sync" rather
    // than crashing the session.
  }
}

export function enqueueOfflineAnswer(entry: QueuedAnswer) {
  writeQueue([...readQueue(), entry]);
}

export function hasQueuedAnswers(): boolean {
  return readQueue().length > 0;
}

let flushing = false;

/** Replays queued answers against the server in order. Safe to call anytime
 * (app start, `online` event, another tab) — `/api/learn/answer` is
 * idempotent per (sessionId, wordId, exercise), so resending an
 * already-recorded answer just returns the stored result instead of
 * double-counting XP/FSRS. Stops at the first failure and keeps the rest
 * queued for the next attempt. */
export async function flushOfflineQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const remaining = readQueue();
    while (remaining.length > 0) {
      const entry = remaining[0];
      try {
        await postLearnAnswer({
          sessionId: entry.sessionId,
          wordId: entry.wordId,
          exercise: entry.exercise,
          responseMs: entry.responseMs,
          practice: entry.practice,
          ...entry.payload,
        });
      } catch {
        break;
      }
      remaining.shift();
      writeQueue(remaining);
    }
  } finally {
    flushing = false;
  }
}
