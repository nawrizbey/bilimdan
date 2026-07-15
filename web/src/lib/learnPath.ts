import type { BlockKey, LearnPathResponse } from '../types/api';

/** First unlocked, not-yet-done block across the whole path — used both by the
 * path screen's node states and by the session summary's "continue" action. */
export function findActiveBlock(path: LearnPathResponse): { unitId: number; lessonIndex: number; block: BlockKey } | null {
  for (const unit of path.units) {
    if (unit.locked) continue;
    for (const lesson of unit.lessons) {
      if (lesson.complete) continue;
      const block = lesson.blocks.find((b) => !b.done && !b.locked);
      if (block) return { unitId: unit.id, lessonIndex: lesson.index, block: block.key };
    }
  }
  return null;
}
