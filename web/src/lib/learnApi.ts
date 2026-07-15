import { api } from './api';
import type {
  BlockKey,
  ExerciseType,
  LearnAnswerResponse,
  LearnPathResponse,
  LearnSessionActiveData,
  LearnSessionStartResponse,
  LearnSummaryResponse,
} from '../types/api';

export function getLearnPath() {
  return api.get<LearnPathResponse>('/api/learn/path');
}

export function startLessonSession(unitId: number, lessonIndex: number, block: BlockKey) {
  return api.post<LearnSessionStartResponse>('/api/learn/session-start', { type: 'lesson', unitId, lessonIndex, block });
}

export function startReviewSession() {
  return api.post<LearnSessionStartResponse>('/api/learn/session-start', { type: 'review' });
}

export function getActiveLearnSession() {
  return api.get<{ session: null } | LearnSessionActiveData>('/api/learn/session-active');
}

export function postLearnAnswer(args: {
  sessionId: number;
  wordId: number;
  exercise: ExerciseType;
  correct: boolean;
  responseMs: number;
}) {
  return api.post<LearnAnswerResponse>('/api/learn/answer', args);
}

export function completeLearnSession(sessionId: number) {
  return api.post<LearnSummaryResponse>('/api/learn/session-complete', { sessionId });
}
