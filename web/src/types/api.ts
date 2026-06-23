export interface ApiUser {
  id: number;
  username: string;
  fullName: string;
  grade: string;
  region: string;
  district: string;
  school: string;
  xp: number;
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  streak: number;
  goalMin: number;
  goalDoneToday: number;
  wordsKnownCount: number;
  speakAttemptsCount: number;
  battleWins: number;
  battleLosses: number;
  battleDraws: number;
  settings: {
    mic: boolean;
    sfx: boolean;
    head: boolean;
    notify: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiSchool {
  id: number;
  name: string;
  districtId: number;
}

export interface ApiDistrict {
  id: number;
  name: string;
  regionId: number;
  schools: ApiSchool[];
}

export interface ApiRegion {
  id: number;
  name: string;
  districts: ApiDistrict[];
}

export interface LocationsResponse {
  regions: ApiRegion[];
}

export interface ApiUnit {
  id: number;
  title: string;
  order: number;
  emoji: string;
  wordsCount: number;
  pct: number;
}

export interface ApiWord {
  id: number;
  en: string;
  ipa: string;
  uz: string;
  example: string;
  emoji: string;
  known: boolean;
}

export interface UnitWordsResponse {
  unit: { id: number; title: string; emoji: string };
  words: ApiWord[];
}

export interface ApiQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  order: number;
}

export interface ApiBadge {
  id: number;
  key: string;
  title: string;
  desc: string;
  emoji: string;
  earned: boolean;
  earnedAt: string | null;
}

export type LeaderboardScope = 'school' | 'district' | 'region' | 'republic';

export interface LeaderboardEntry {
  rank: number;
  id: number;
  isMe: boolean;
  name: string;
  initial: string;
  xp: number;
  words: number;
}

export interface LeaderboardResponse {
  scope: LeaderboardScope;
  scopeLabel: string;
  ranks: Record<LeaderboardScope, number>;
  board: LeaderboardEntry[];
}

export interface BattleOpponent {
  name: string;
  initial: string;
}

export interface BattleQuestionPayload {
  id: number;
  question: string;
  options: string[];
}

export type BattleServerMessage =
  | { type: 'queue:waiting' }
  | { type: 'match:found'; matchId: number; opponent: BattleOpponent; startsInMs: number; yourScore: number; oppScore: number }
  | { type: 'question:start'; qIndex: number; question: BattleQuestionPayload; deadline: number }
  | {
      type: 'question:reveal';
      qIndex: number;
      correctIndex: number;
      yourChoice: number | null;
      oppChoice: number | null;
      yourScore: number;
      oppScore: number;
    }
  | {
      type: 'match:end';
      winnerId: number | null;
      finalScores: { yours: number; opponent: number };
      xpAwarded: number;
      user: ApiUser;
    }
  | { type: 'error'; code: string; message: string };
