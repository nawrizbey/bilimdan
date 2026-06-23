const XP_PER_LEVEL = 250;

export function computeLevel(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  return { level, xpInLevel, xpForNextLevel };
}
