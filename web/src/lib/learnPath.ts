import type { LearnPathResponse } from '../types/api';

/** First not-yet-complete lesson in the first unlocked unit — used both by the
 * path screen's node states and by the session summary's "continue" action. */
export function findActiveLesson(path: LearnPathResponse): { unitId: number; lessonIndex: number } | null {
  for (const unit of path.units) {
    if (unit.locked) continue;
    for (const lesson of unit.lessons) {
      if (!lesson.complete) return { unitId: unit.id, lessonIndex: lesson.index };
    }
  }
  return null;
}
