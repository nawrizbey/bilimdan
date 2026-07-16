// Client-side mirror of server/src/lib/typing.ts, used only for offline
// grading fallback (see offlineGrade.ts) — the server's copy stays the
// source of truth once the answer reaches it.

export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) distances[i][0] = i;
  for (let j = 0; j < cols; j++) distances[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost,
      );
    }
  }
  return distances[rows - 1][cols - 1];
}

export function gradeTypedAnswer(input: string, target: string): { correct: boolean; almost: boolean } {
  const a = input.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (a === b) return { correct: true, almost: false };

  const maxDistance = b.length >= 10 ? 2 : b.length >= 5 ? 1 : 0;
  if (maxDistance > 0 && levenshteinDistance(a, b) <= maxDistance) {
    return { correct: true, almost: true };
  }
  return { correct: false, almost: false };
}
