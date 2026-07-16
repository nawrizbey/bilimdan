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

/** Grades a typed answer (type_en/dictation) with typo tolerance: an exact
 * case-insensitive match is always correct. A small edit-distance slip — one
 * adjacent-key typo or transposition on a word of 5+ letters, up to two on a
 * word of 10+ — still counts as correct (FSRS still records it as a correct
 * retrieval) but is flagged `almost` so the UI can show a distinct "check the
 * spelling" message instead of plain success. Shorter words get no tolerance:
 * a single-letter slip on a 3-4 letter word usually changes it into a
 * different real word, not a typo. */
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
