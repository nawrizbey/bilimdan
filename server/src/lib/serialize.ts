import type { User, Region, District, School } from '@prisma/client';
import { computeLevel } from './level';

type UserWithLocation = User & { region: Region; district: District; school: School };

export function serializeUser(user: UserWithLocation) {
  const { level, xpInLevel, xpForNextLevel } = computeLevel(user.xp);
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    grade: user.grade,
    region: user.region.name,
    district: user.district.name,
    school: user.school.name,
    xp: user.xp,
    level,
    xpInLevel,
    xpForNextLevel,
    streak: user.streak,
    goalMin: user.goalMin,
    goalDoneToday: user.goalDoneToday,
    wordsKnownCount: user.wordsKnownCount,
    speakAttemptsCount: user.speakAttemptsCount,
    battleWins: user.battleWins,
    battleLosses: user.battleLosses,
    battleDraws: user.battleDraws,
    settings: {
      mic: user.micEnabled,
      sfx: user.sfxEnabled,
      head: user.headEnabled,
      notify: user.notifyEnabled,
    },
  };
}
