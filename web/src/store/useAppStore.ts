import { create } from 'zustand';
import { api, ApiError, getToken, setToken } from '../lib/api';
import { saveLearnSession, loadLearnSession, clearLearnSession } from '../lib/learnSessionStorage';
import { getErrorMessage } from '../lib/errorMessage';
import i18n from '../i18n';
import type {
  ApiBadge,
  ApiQuizQuestion,
  ApiUnit,
  ApiUser,
  ApiWord,
  AuthResponse,
  BattleOpponent,
  BattleQuestionPayload,
  BattleServerMessage,
  LeaderboardResponse,
  LeaderboardScope,
  ListenQuestion,
  LocationsResponse,
  UnitWordsResponse,
} from '../types/api';

interface SignupForm {
  fullName: string;
  username: string;
  password: string;
  regionId: number | null;
  districtId: number | null;
  schoolId: number | null;
}

interface SettingsToggles {
  mic: boolean;
  sfx: boolean;
  head: boolean;
  notify: boolean;
}

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export type LearnPhase = 'familiarize' | 'write' | 'speak' | 'test' | 'summary';

export interface TestQuestion {
  wordId: number;
  word: string;
  uz: string;
  options: string[];
  correctIndex: number;
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}


/** The unit Learn/Dashboard should point a student at: the first not-yet-complete
 * unit that actually has words, falling back to the first playable unit if every
 * unit is already 100% known. */
export function pickTargetUnit(units: ApiUnit[]): ApiUnit | undefined {
  const playable = units.filter((u) => u.wordsCount > 0);
  return playable.find((u) => u.pct < 100) ?? playable[0];
}

/** Builds one 4-option (or fewer, for tiny units) MCQ per word: "so'zning tarjimasi
 * qaysi?" with distractors drawn from the other words in the same unit. */
function buildTestQuestions(words: ApiWord[]): TestQuestion[] {
  return words.map((w) => {
    const distractorPool = words.filter((o) => o.id !== w.id).map((o) => o.uz);
    const distractors = shuffled(distractorPool).slice(0, Math.min(3, distractorPool.length));
    const options = shuffled([...distractors, w.uz]);
    return { wordId: w.id, word: w.en, uz: w.uz, options, correctIndex: options.indexOf(w.uz) };
  });
}

const emptyLearnSessionFields = {
  card: 0,
  flipped: false,
  familiarizeViewed: [0] as number[],
  writeIdx: 0,
  writeInput: '',
  writeResult: null as 'correct' | 'incorrect' | null,
  writeCorrectCount: 0,
  writeMissedWords: [] as string[],
  learnSpeakIdx: 0,
  learnSpeakScore: null as number | null,
  learnSpeakTranscript: null as string | null,
  testQuestions: [] as TestQuestion[],
  testIdx: 0,
  testSel: null as number | null,
  testCorrectCount: 0,
  sessionXpGained: 0,
  allUnitsCompleted: false,
  sessionSaveError: null as string | null,
};

interface AppState {
  authStatus: AuthStatus;
  userId: number | null;
  studentName: string;
  region: string;
  district: string;
  school: string;
  goalMin: number;
  goalDone: number;
  streak: number;
  xp: number;
  wordsKnownCount: number;
  battleWins: number;

  signupForm: SignupForm;
  setSignupField: <K extends keyof SignupForm>(field: K, value: SignupForm[K]) => void;

  locations: LocationsResponse | null;
  loadLocations: () => Promise<void>;

  loadSession: () => Promise<void>;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;

  // Units (Lessons)
  units: ApiUnit[] | null;
  loadUnits: () => Promise<void>;

  // Learn — which unit is active
  currentUnitId: number | null;
  currentUnitTitle: string;
  currentUnitWords: ApiWord[];
  loadingUnitWords: boolean;
  loadUnitWords: (unitId: number) => Promise<void>;
  ensureCurrentUnit: () => Promise<void>;

  // Learn — 4-phase session: familiarize -> write -> speak -> test -> summary
  learnPhase: LearnPhase;
  // Familiarize
  card: number;
  flipped: boolean;
  familiarizeViewed: number[];
  flipCard: () => void;
  nextCardLocal: () => void;
  prevCard: () => void;
  finishFamiliarize: () => void;
  // Write
  writeIdx: number;
  writeInput: string;
  writeResult: 'correct' | 'incorrect' | null;
  writeCorrectCount: number;
  writeMissedWords: string[];
  setWriteInput: (text: string) => void;
  submitWrite: () => void;
  nextWrite: () => void;
  // Speak (scoped to the current unit, distinct from the standalone Speak screen)
  learnSpeakIdx: number;
  learnSpeakScore: number | null;
  learnSpeakTranscript: string | null;
  learnSpeakStart: () => void;
  learnSpeakFinish: (score: number, transcript: string) => Promise<void>;
  learnSpeakNext: () => void;
  // Test
  testQuestions: TestQuestion[];
  testIdx: number;
  testSel: number | null;
  testCorrectCount: number;
  pickTest: (i: number) => void;
  nextTest: () => void;
  // Session completion
  sessionXpGained: number;
  allUnitsCompleted: boolean;
  sessionSaveError: string | null;
  completeLearnSession: () => Promise<void>;
  /** Loads the next not-yet-completed unit. Returns false if every unit is already
   * complete (i.e. it looped back to the same unit), so the UI can show a banner. */
  advanceToNextUnit: () => Promise<boolean>;

  // Battle (WebSocket-driven)
  battleStatus: 'idle' | 'queueing' | 'matched' | 'playing' | 'revealed' | 'ended';
  battleOpponent: BattleOpponent | null;
  battleQIndex: number;
  battleQuestion: BattleQuestionPayload | null;
  battleDeadline: number | null;
  battleMyScore: number;
  battleOppScore: number;
  battleYourChoice: number | null;
  battleOppChoice: number | null;
  battleCorrectIndex: number | null;
  battleWinnerId: number | null;
  battleXpAwarded: number;
  battleApplyMessage: (msg: BattleServerMessage) => void;
  battleSetQueueing: () => void;
  battleReset: () => void;

  // Quiz
  quizQuestions: ApiQuizQuestion[];
  loadQuiz: () => Promise<void>;
  qq: number;
  qSel: number | null;
  qScore: number;
  pickQuiz: (i: number) => Promise<void>;
  retryQuiz: () => void;

  // Listen
  listenQuestions: ListenQuestion[];
  listenIdx: number;
  listenSel: number | null;
  listenScore: number;
  loadListen: () => Promise<void>;
  pickListen: (i: number) => void;
  retryListen: () => void;

  // Leaders
  leaderScope: LeaderboardScope;
  leaderboard: LeaderboardResponse | null;
  loadLeaderboard: (scope?: LeaderboardScope) => Promise<void>;
  setLeaderScope: (scope: LeaderboardScope) => void;

  // Badges
  badges: ApiBadge[] | null;
  loadBadges: () => Promise<void>;

  // Settings
  settings: SettingsToggles;
  toggleSetting: (key: keyof SettingsToggles) => Promise<void>;
  setGoalMin: (min: number) => Promise<void>;
}

const emptySignupForm: SignupForm = {
  fullName: '',
  username: '',
  password: '',
  regionId: null,
  districtId: null,
  schoolId: null,
};

let quizAdvanceTimeout: ReturnType<typeof setTimeout> | undefined;
let listenAdvanceTimeout: ReturnType<typeof setTimeout> | undefined;

function userToFields(user: ApiUser) {
  return {
    userId: user.id,
    studentName: user.fullName.split(' ')[0] || user.username,
    region: user.region,
    district: user.district,
    school: user.school,
    goalMin: user.goalMin,
    goalDone: user.goalDoneToday,
    streak: user.streak,
    xp: user.xp,
    wordsKnownCount: user.wordsKnownCount,
    battleWins: user.battleWins,
    settings: user.settings,
  };
}

export const useAppStore = create<AppState>((set, get) => {
  /** Snapshots the in-progress learn session to sessionStorage after every
   * meaningful step, so an accidental page refresh resumes instead of losing
   * the student's progress. No-ops once the session reaches 'summary'. */
  function persistLearnSession() {
    const s = get();
    if (s.currentUnitId == null || s.learnPhase === 'summary') return;
    saveLearnSession({
      currentUnitId: s.currentUnitId,
      learnPhase: s.learnPhase,
      card: s.card,
      familiarizeViewed: s.familiarizeViewed,
      writeIdx: s.writeIdx,
      writeCorrectCount: s.writeCorrectCount,
      writeMissedWords: s.writeMissedWords,
      learnSpeakIdx: s.learnSpeakIdx,
      testQuestions: s.testQuestions,
      testIdx: s.testIdx,
      testCorrectCount: s.testCorrectCount,
    });
  }

  /** Applies a background progress-sync response, or degrades gracefully:
   * logs out on an expired session, otherwise leaves the optimistic local
   * state in place and logs the failure (the next successful sync reconciles it). */
  async function syncUser(request: Promise<{ user: ApiUser }>) {
    try {
      const { user } = await request;
      set(userToFields(user));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        get().logout();
      } else {
        console.error('Progress sync failed:', err);
      }
    }
  }

  return {
  authStatus: 'idle',
  userId: null,
  studentName: '',
  region: '',
  district: '',
  school: '',
  grade: '5',
  goalMin: 30,
  goalDone: 0,
  streak: 0,
  xp: 0,
  wordsKnownCount: 0,
  battleWins: 0,

  signupForm: emptySignupForm,
  setSignupField: (field, value) =>
    set((s) => {
      const next = { ...s.signupForm, [field]: value };
      if (field === 'regionId') {
        next.districtId = null;
        next.schoolId = null;
      }
      if (field === 'districtId') {
        next.schoolId = null;
      }
      return { signupForm: next };
    }),

  locations: null,
  loadLocations: async () => {
    if (get().locations) return;
    const data = await api.get<LocationsResponse>('/api/locations');
    set({ locations: data });
  },

  loadSession: async () => {
    const token = getToken();
    if (!token) {
      set({ authStatus: 'unauthenticated' });
      return;
    }
    set({ authStatus: 'loading' });
    try {
      const { user } = await api.get<{ user: ApiUser }>('/api/auth/me');
      set({ ...userToFields(user), authStatus: 'authenticated' });
    } catch {
      setToken(null);
      set({ authStatus: 'unauthenticated' });
    }
  },

  login: async (username, password, remember = true) => {
    const { token, user } = await api.post<AuthResponse>('/api/auth/login', { username, password });
    setToken(token, remember);
    set({ ...userToFields(user), authStatus: 'authenticated' });
  },

  signup: async () => {
    const f = get().signupForm;
    const { token, user } = await api.post<AuthResponse>('/api/auth/signup', {
      fullName: f.fullName,
      username: f.username,
      password: f.password,
      regionId: f.regionId,
      districtId: f.districtId,
      schoolId: f.schoolId,
    });
    setToken(token);
    set({ ...userToFields(user), authStatus: 'authenticated', signupForm: emptySignupForm });
  },

  logout: () => {
    clearTimeout(quizAdvanceTimeout);
    clearTimeout(listenAdvanceTimeout);
    setToken(null);
    clearLearnSession();
    set({
      authStatus: 'unauthenticated',
      userId: null,
      signupForm: emptySignupForm,
      studentName: '',
      region: '',
      district: '',
      school: '',
      units: null,
      currentUnitId: null,
      currentUnitWords: [],
      learnPhase: 'familiarize',
      ...emptyLearnSessionFields,
      quizQuestions: [],
      listenQuestions: [],
      listenIdx: 0,
      listenSel: null,
      listenScore: 0,
      leaderboard: null,
      badges: null,
      battleStatus: 'idle',
      battleOpponent: null,
      battleQuestion: null,
      battleDeadline: null,
    });
  },

  // Units
  units: null,
  loadUnits: async () => {
    const { units } = await api.get<{ units: ApiUnit[] }>('/api/units');
    set({ units });
  },

  // Learn — unit loading
  currentUnitId: null,
  currentUnitTitle: '',
  currentUnitWords: [],
  loadingUnitWords: false,
  loadUnitWords: async (unitId) => {
    set({ loadingUnitWords: true });
    clearLearnSession();
    try {
      const { unit, words } = await api.get<UnitWordsResponse>(`/api/units/${unitId}/words`);
      set({
        currentUnitId: unit.id,
        currentUnitTitle: unit.title,
        currentUnitWords: words,
        learnPhase: 'familiarize',
        ...emptyLearnSessionFields,
      });
    } finally {
      set({ loadingUnitWords: false });
    }
  },
  ensureCurrentUnit: async () => {
    if (get().currentUnitId != null) return;

    const saved = loadLearnSession();
    if (saved && saved.learnPhase !== 'summary') {
      if (!get().units) await get().loadUnits();
      const stillValid = (get().units ?? []).some((u) => u.id === saved.currentUnitId);
      if (stillValid) {
        try {
          const { unit, words } = await api.get<UnitWordsResponse>(`/api/units/${saved.currentUnitId}/words`);
          set({
            currentUnitId: unit.id,
            currentUnitTitle: unit.title,
            currentUnitWords: words,
            learnPhase: saved.learnPhase,
            card: saved.card,
            flipped: false,
            familiarizeViewed: saved.familiarizeViewed,
            writeIdx: saved.writeIdx,
            writeInput: '',
            writeResult: null,
            writeCorrectCount: saved.writeCorrectCount,
            writeMissedWords: saved.writeMissedWords,
            learnSpeakIdx: saved.learnSpeakIdx,
            learnSpeakScore: null,
            learnSpeakTranscript: null,
            testQuestions: saved.testQuestions,
            testIdx: saved.testIdx,
            testSel: null,
            testCorrectCount: saved.testCorrectCount,
            sessionSaveError: null,
          });
          return;
        } catch {
          clearLearnSession();
        }
      } else {
        clearLearnSession();
      }
    }

    if (!get().units) await get().loadUnits();
    const target = pickTargetUnit(get().units ?? []);
    if (target) await get().loadUnitWords(target.id);
  },

  // Learn — session phase machine
  learnPhase: 'familiarize',
  ...emptyLearnSessionFields,
  flipCard: () =>
    set((s) => {
      const familiarizeViewed = s.familiarizeViewed.includes(s.card) ? s.familiarizeViewed : [...s.familiarizeViewed, s.card];
      return { flipped: !s.flipped, familiarizeViewed };
    }),
  nextCardLocal: () => {
    set((s) => {
      const total = s.currentUnitWords.length;
      if (total === 0) return s;
      const card = (s.card + 1) % total;
      const familiarizeViewed = s.familiarizeViewed.includes(card) ? s.familiarizeViewed : [...s.familiarizeViewed, card];
      return { card, flipped: false, familiarizeViewed };
    });
    persistLearnSession();
  },
  prevCard: () => {
    set((s) => {
      const total = s.currentUnitWords.length;
      if (total === 0) return s;
      const card = (s.card - 1 + total) % total;
      const familiarizeViewed = s.familiarizeViewed.includes(card) ? s.familiarizeViewed : [...s.familiarizeViewed, card];
      return { card, flipped: false, familiarizeViewed };
    });
    persistLearnSession();
  },
  finishFamiliarize: () => {
    set({ learnPhase: 'write', writeIdx: 0, writeInput: '', writeResult: null, writeCorrectCount: 0, writeMissedWords: [] });
    persistLearnSession();
  },

  setWriteInput: (text) => set({ writeInput: text }),
  submitWrite: () => {
    const { writeInput, writeIdx, currentUnitWords, writeResult, writeCorrectCount, writeMissedWords } = get();
    if (writeResult != null) return;
    const word = currentUnitWords[writeIdx];
    if (!word) return;
    const correct = writeInput.trim().toLowerCase() === word.en.trim().toLowerCase();
    set({
      writeResult: correct ? 'correct' : 'incorrect',
      writeCorrectCount: correct ? writeCorrectCount + 1 : writeCorrectCount,
      writeMissedWords: correct ? writeMissedWords : [...writeMissedWords, word.en],
    });
    persistLearnSession();
  },
  nextWrite: () => {
    const { writeIdx, currentUnitWords } = get();
    if (writeIdx + 1 >= currentUnitWords.length) {
      set({ learnPhase: 'speak', learnSpeakIdx: 0, learnSpeakScore: null, learnSpeakTranscript: null });
    } else {
      set({ writeIdx: writeIdx + 1, writeInput: '', writeResult: null });
    }
    persistLearnSession();
  },

  learnSpeakStart: () => set({ learnSpeakScore: null, learnSpeakTranscript: null }),
  learnSpeakFinish: async (score, transcript) => {
    set({ learnSpeakScore: score, learnSpeakTranscript: transcript });
    await syncUser(api.post<{ user: ApiUser }>('/api/speak/result', { score }));
  },
  learnSpeakNext: () => {
    const { learnSpeakIdx, currentUnitWords } = get();
    if (learnSpeakIdx + 1 >= currentUnitWords.length) {
      const words = currentUnitWords;
      set({ testQuestions: buildTestQuestions(words), testIdx: 0, testSel: null, testCorrectCount: 0, learnPhase: 'test' });
    } else {
      set({ learnSpeakIdx: learnSpeakIdx + 1, learnSpeakScore: null, learnSpeakTranscript: null });
    }
    persistLearnSession();
  },

  pickTest: (i) => {
    const { testSel, testQuestions, testIdx, testCorrectCount } = get();
    if (testSel != null) return;
    const q = testQuestions[testIdx];
    if (!q) return;
    const correct = i === q.correctIndex;
    set({ testSel: i, testCorrectCount: correct ? testCorrectCount + 1 : testCorrectCount });
    persistLearnSession();
  },
  nextTest: () => {
    const { testIdx, testQuestions } = get();
    if (testIdx + 1 >= testQuestions.length) {
      void get().completeLearnSession();
    } else {
      set({ testIdx: testIdx + 1, testSel: null });
      persistLearnSession();
    }
  },

  completeLearnSession: async () => {
    const { currentUnitId, writeCorrectCount, testCorrectCount, xp: xpBefore } = get();
    if (currentUnitId == null) {
      set({ learnPhase: 'summary' });
      return;
    }
    set({ sessionSaveError: null });
    try {
      const { user } = await api.post<{ user: ApiUser }>('/api/learn/session-complete', {
        unitId: currentUnitId,
        writeCorrect: writeCorrectCount,
        testCorrect: testCorrectCount,
      });
      set({ ...userToFields(user), learnPhase: 'summary', sessionXpGained: Math.max(0, user.xp - xpBefore) });
      clearLearnSession();
    } catch (err) {
      console.error('Session complete failed:', err);
      const message = err instanceof ApiError ? getErrorMessage(i18n.t, err) : i18n.t('common.networkError');
      set({ sessionSaveError: message });
    }
  },
  advanceToNextUnit: async () => {
    const previousUnitId = get().currentUnitId;
    await get().loadUnits();
    set({ currentUnitId: null });
    await get().ensureCurrentUnit();
    const newUnitId = get().currentUnitId;
    const hasNext = newUnitId != null && newUnitId !== previousUnitId;
    set({ allUnitsCompleted: !hasNext, learnPhase: hasNext ? 'familiarize' : 'summary' });
    return hasNext;
  },

  // Battle (WebSocket-driven; the socket itself is owned by BattleScreen,
  // which feeds server messages into battleApplyMessage)
  battleStatus: 'idle',
  battleOpponent: null,
  battleQIndex: 0,
  battleQuestion: null,
  battleDeadline: null,
  battleMyScore: 0,
  battleOppScore: 0,
  battleYourChoice: null,
  battleOppChoice: null,
  battleCorrectIndex: null,
  battleWinnerId: null,
  battleXpAwarded: 0,
  battleSetQueueing: () => set({ battleStatus: 'queueing' }),
  battleApplyMessage: (msg: BattleServerMessage) => {
    switch (msg.type) {
      case 'queue:waiting':
        set({ battleStatus: 'queueing' });
        break;
      case 'match:found':
        set({
          battleStatus: 'matched',
          battleOpponent: msg.opponent,
          battleQIndex: 0,
          battleMyScore: msg.yourScore,
          battleOppScore: msg.oppScore,
          battleYourChoice: null,
          battleOppChoice: null,
          battleCorrectIndex: null,
        });
        break;
      case 'question:start':
        set({
          battleStatus: 'playing',
          battleQIndex: msg.qIndex,
          battleQuestion: msg.question,
          battleDeadline: msg.deadline,
          battleYourChoice: null,
          battleOppChoice: null,
          battleCorrectIndex: null,
        });
        break;
      case 'question:reveal':
        set({
          battleStatus: 'revealed',
          battleCorrectIndex: msg.correctIndex,
          battleYourChoice: msg.yourChoice,
          battleOppChoice: msg.oppChoice,
          battleMyScore: msg.yourScore,
          battleOppScore: msg.oppScore,
        });
        break;
      case 'match:end':
        set({
          battleStatus: 'ended',
          battleWinnerId: msg.winnerId,
          battleMyScore: msg.finalScores.yours,
          battleOppScore: msg.finalScores.opponent,
          battleXpAwarded: msg.xpAwarded,
          ...userToFields(msg.user),
        });
        break;
      case 'error':
        console.error('Battle error:', msg.message);
        break;
    }
  },
  battleReset: () =>
    set({
      battleStatus: 'idle',
      battleOpponent: null,
      battleQIndex: 0,
      battleQuestion: null,
      battleDeadline: null,
      battleMyScore: 0,
      battleOppScore: 0,
      battleYourChoice: null,
      battleOppChoice: null,
      battleCorrectIndex: null,
      battleWinnerId: null,
      battleXpAwarded: 0,
    }),

  // Quiz
  quizQuestions: [],
  loadQuiz: async () => {
    if (get().quizQuestions.length > 0) return;
    const { questions } = await api.get<{ questions: ApiQuizQuestion[] }>('/api/quiz');
    set({ quizQuestions: questions });
  },
  qq: 0,
  qSel: null,
  qScore: 0,
  pickQuiz: async (i) => {
    if (get().qSel != null) return;
    const question = get().quizQuestions[get().qq];
    const isCorrect = i === question.correctIndex;
    set((s) => ({ qSel: i, qScore: s.qScore + (isCorrect ? 1 : 0) }));
    clearTimeout(quizAdvanceTimeout);
    quizAdvanceTimeout = setTimeout(() => {
      set((s) => ({ qq: s.qq + 1, qSel: null }));
    }, 1300);

    await syncUser(api.post<{ user: ApiUser }>('/api/quiz/answer', { questionId: question.id, picked: i }));
  },
  retryQuiz: () => {
    clearTimeout(quizAdvanceTimeout);
    set({ qq: 0, qSel: null, qScore: 0, quizQuestions: [] });
    void get().loadQuiz();
  },

  // Listen
  listenQuestions: [],
  listenIdx: 0,
  listenSel: null,
  listenScore: 0,
  loadListen: async () => {
    if (get().listenQuestions.length > 0) return;
    const { questions } = await api.get<{ questions: ListenQuestion[] }>('/api/listen');
    set({ listenQuestions: shuffled(questions) });
  },
  pickListen: (i) => {
    if (get().listenSel != null) return;
    const question = get().listenQuestions[get().listenIdx];
    if (!question) return;
    const isCorrect = i === question.correctIndex;
    set((s) => ({ listenSel: i, listenScore: s.listenScore + (isCorrect ? 1 : 0) }));
    void api.post<{ correct: boolean; user: ApiUser }>('/api/listen/answer', { questionId: question.id, picked: i });
    clearTimeout(listenAdvanceTimeout);
    listenAdvanceTimeout = setTimeout(() => {
      set((s) => ({ listenIdx: s.listenIdx + 1, listenSel: null }));
    }, 1200);
  },
  retryListen: () => {
    clearTimeout(listenAdvanceTimeout);
    set({ listenIdx: 0, listenSel: null, listenScore: 0, listenQuestions: [] });
    void get().loadListen();
  },

  // Leaders
  leaderScope: 'school',
  leaderboard: null,
  loadLeaderboard: async (scope) => {
    const targetScope = scope ?? get().leaderScope;
    const data = await api.get<LeaderboardResponse>(`/api/leaderboard?scope=${targetScope}`);
    set({ leaderboard: data, leaderScope: targetScope });
  },
  setLeaderScope: (scope) => {
    set({ leaderScope: scope });
    get().loadLeaderboard(scope);
  },

  // Badges
  badges: null,
  loadBadges: async () => {
    const { badges } = await api.get<{ badges: ApiBadge[] }>('/api/badges');
    set({ badges });
  },

  // Settings
  settings: { mic: true, sfx: true, head: true, notify: false },
  toggleSetting: async (key) => {
    const next = { ...get().settings, [key]: !get().settings[key] };
    set({ settings: next });
    await syncUser(api.patch<{ user: ApiUser }>('/api/settings', { [key]: next[key] }));
  },
  setGoalMin: async (min) => {
    set({ goalMin: min });
    await syncUser(api.patch<{ user: ApiUser }>('/api/profile', { goalMin: min }));
  },
  };
});
