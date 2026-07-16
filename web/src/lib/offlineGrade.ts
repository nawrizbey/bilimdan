import { gradeTypedAnswer } from './typing';
import type { ExerciseType, LearnAnswerPayload, LearnQueueItem } from '../types/api';

const TYPO_TOLERANT: ExerciseType[] = ['type_en', 'dictation'];
const EXACT_TYPING: ExerciseType[] = ['letter_tiles'];

/** Best-effort grading used only when `/api/learn/answer` can't be reached
 * (offline). For `intro`/`speak`/typing-family exercises the right answer
 * (`word.en`) is already part of the queue item the client holds, so this
 * matches the server exactly. MCQ-family exercises (mcq_en2kaa, mcq_kaa2en,
 * listen_pick, fill_blank) keep their answer key server-side only — those
 * can't be verified locally, so an offline attempt is optimistically counted
 * as correct and the real result is reconciled once the queued answer
 * reaches the server on flush. */
export function gradeOffline(item: LearnQueueItem, payload: LearnAnswerPayload): { correct: boolean; almost?: boolean } {
  if (item.exercise === 'intro') return { correct: true };
  if ('correct' in payload) return { correct: payload.correct };
  if ('answerText' in payload) {
    if (EXACT_TYPING.includes(item.exercise)) {
      return { correct: payload.answerText.trim().toLowerCase() === item.word.en.trim().toLowerCase() };
    }
    if (TYPO_TOLERANT.includes(item.exercise)) {
      return gradeTypedAnswer(payload.answerText, item.word.en);
    }
    return { correct: payload.answerText.trim().toLowerCase() === item.word.en.trim().toLowerCase() };
  }
  return { correct: true };
}
