function levenshteinDistance(a: string, b: string): number {
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

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z\s]/g, '');
}

/** Scores a transcribed phrase against the target word as a 0-100 pronunciation score. */
export function scorePronunciation(transcript: string, target: string): number {
  const heard = normalize(transcript);
  const expected = normalize(target);
  if (!heard || !expected) return 0;

  const directDistance = levenshteinDistance(heard, expected);
  const directScore = 1 - directDistance / Math.max(heard.length, expected.length);

  // Recognizer sometimes returns the word inside a short phrase (e.g. "the curious").
  const words = heard.split(/\s+/);
  const bestWordDistance = Math.min(...words.map((w) => levenshteinDistance(w, expected)));
  const bestWordScore = 1 - bestWordDistance / Math.max(expected.length, 1);

  const ratio = Math.max(directScore, bestWordScore);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}
