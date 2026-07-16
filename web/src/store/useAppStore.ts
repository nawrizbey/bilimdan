import { create } from 'zustand';
import { api, ApiError, getToken, setToken } from '../lib/api';
import {
  completeLearnSession as apiCompleteLearnSession,
  getActiveLearnSession,
  getLearnPath,
  postLearnAnswer,
  startHardSession,
  startLessonSession,
  startReviewSession,
} from '../lib/learnApi';
import { getTodayQuests } from '../lib/questsApi';
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
  BlockKey,
  DailyQuest,
  LearnAnswerPayload,
  LeaderboardResponse,
  LeaderboardScope,
  LearnPathResponse,
  LearnQueueItem,
  LearnSessionUnit,
  LearnSummaryResponse,
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

export interface LearnSessionState {
  sessionId: number;
  type: 'lesson' | 'review' | 'hard';
  unit: LearnSessionUnit | null;
  queue: (LearnQueueItem & { isRepeat?: boolean })[];
  cursor: number;
  hearts: number;
  maxHearts: number;
  combo: number;
  correctCount: number;
  /** Bumped every time hearts would drop to 0 (and get refilled to 1) — the
   * session screen watches this to fire the "Itibarlıraq bolıń!" toast once. */
  heartsEmptyTick: number;
  status: 'active' | 'summary';
  summary: LearnSummaryResponse | null;
}

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

  // Active unit (used by Lessons, Games, and the search in Topbar)
  currentUnitId: number | null;
  currentUnitTitle: string;
  currentUnitWords: ApiWord[];
  loadingUnitWords: boolean;
  loadUnitWords: (unitId: number) => Promise<void>;
  ensureCurrentUnit: () => Promise<void>;

  // Learn (FSRS-based path + session)
  learnPath: LearnPathResponse | null;
  loadLearnPath: () => Promise<void>;
  learnSession: LearnSessionState | null;
  startLearnSession: (
    args: { type: 'lesson'; unitId: number; lessonIndex: number; block: BlockKey } | { type: 'review' } | { type: 'hard' },
  ) => Promise<void>;
  resumeLearnSession: () => Promise<boolean>;
  /** Submits an attempt for grading and returns the server's verdict
   * immediately, so the exercise component can show feedback. The queue
   * only advances (hearts/combo/cursor, possibly completing the session)
   * after `revealDelayMs` — long enough for the component to display that
   * feedback before the next exercise mounts. */
  answerCurrent: (
    payload: LearnAnswerPayload,
    responseMs: number,
    revealDelayMs: number,
  ) => Promise<{ correct: boolean; correctIndex?: number; almost?: boolean }>;
  completeLearnSession: () => Promise<LearnSummaryResponse>;
  abandonLearnSession: () => void;

  // Daily quests
  dailyQuests: DailyQuest[] | null;
  loadDailyQuests: () => Promise<void>;

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

  /** Applies hearts/combo/cursor effects for an already-graded attempt and
   * advances the queue — called after a delay so the exercise component has
   * time to show feedback with the grading result first. `cursorAtAnswer`
   * guards against a stale timer firing after the session moved on (e.g. the
   * user exited) or, defensively, firing twice for the same item. */
  async function advanceLearnQueue(cursorAtAnswer: number, item: LearnSessionState['queue'][number], correct: boolean) {
    const session = get().learnSession;
    if (!session || session.status !== 'active' || session.cursor !== cursorAtAnswer) return;

    let hearts = session.hearts;
    let combo = session.combo;
    let correctCount = session.correctCount;
    let heartsEmptyTick = session.heartsEmptyTick;

    if (correct) {
      combo += 1;
      if (!item.isRepeat && item.exercise !== 'intro') correctCount += 1;
    } else {
      combo = 0;
      hearts = Math.max(hearts - 1, 0);
      if (hearts === 0) {
        hearts = 1;
        heartsEmptyTick += 1;
      }
    }

    let queue = session.queue;
    if (!correct) {
      const insertAt = Math.min(session.cursor + 3, queue.length);
      queue = [...queue.slice(0, insertAt), { ...item, isRepeat: true }, ...queue.slice(insertAt)];
    }

    const cursor = session.cursor + 1;
    const finished = cursor >= queue.length;

    set({
      learnSession: {
        ...session,
        queue,
        cursor,
        hearts,
        combo,
        correctCount,
        heartsEmptyTick,
        status: finished ? 'summary' : 'active',
      },
    });

    if (finished) await get().completeLearnSession();
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
      learnPath: null,
      learnSession: null,
      dailyQuests: null,
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

  // Active unit
  currentUnitId: null,
  currentUnitTitle: '',
  currentUnitWords: [],
  loadingUnitWords: false,
  loadUnitWords: async (unitId) => {
    set({ loadingUnitWords: true });
    try {
      const { unit, words } = await api.get<UnitWordsResponse>(`/api/units/${unitId}/words`);
      set({
        currentUnitId: unit.id,
        currentUnitTitle: unit.title,
        currentUnitWords: words,
      });
    } finally {
      set({ loadingUnitWords: false });
    }
  },
  ensureCurrentUnit: async () => {
    if (get().currentUnitId != null) return;
    if (!get().units) await get().loadUnits();
    const target = pickTargetUnit(get().units ?? []);
    if (target) await get().loadUnitWords(target.id);
  },

  // Learn (FSRS-based path + session)
  learnPath: null,
  loadLearnPath: async () => {
    const path = await getLearnPath();
    set({ learnPath: path });
  },
  learnSession: null,
  startLearnSession: async (args) => {
    const res =
      args.type === 'lesson'
        ? await startLessonSession(args.unitId, args.lessonIndex, args.block)
        : args.type === 'hard'
          ? await startHardSession()
          : await startReviewSession();
    set({
      learnSession: {
        sessionId: res.sessionId,
        type: res.type,
        unit: res.unit,
        queue: res.items,
        cursor: 0,
        hearts: 3,
        maxHearts: 3,
        combo: 0,
        correctCount: 0,
        heartsEmptyTick: 0,
        status: 'active',
        summary: null,
      },
    });
  },
  resumeLearnSession: async () => {
    const res = await getActiveLearnSession();
    if (!('sessionId' in res)) return false;

    const answeredKeys = new Set(res.answered.map((a) => `${a.wordId}:${a.exercise}`));
    let cursor = 0;
    while (cursor < res.items.length && answeredKeys.has(`${res.items[cursor].wordId}:${res.items[cursor].exercise}`)) {
      cursor += 1;
    }
    const finished = cursor >= res.items.length;

    set({
      learnSession: {
        sessionId: res.sessionId,
        type: res.type,
        unit: res.unit,
        queue: res.items,
        cursor,
        hearts: 3,
        maxHearts: 3,
        combo: 0,
        correctCount: res.answered.filter((a) => a.exercise !== 'intro' && a.correct).length,
        heartsEmptyTick: 0,
        status: finished ? 'summary' : 'active',
        summary: null,
      },
    });

    if (finished) await get().completeLearnSession();
    return true;
  },
  answerCurrent: async (payload, responseMs, revealDelayMs) => {
    const session = get().learnSession;
    if (!session || session.status !== 'active') return { correct: false };
    const item = session.queue[session.cursor];
    if (!item) return { correct: false };

    // Grading always goes through the server (source of truth for
    // correctness) — including practice/repeat attempts, so the UI can show
    // real feedback for them too, but those don't touch FSRS/mastery or the
    // session's answer log (see the `practice` flag on the endpoint).
    let correct: boolean;
    let correctIndex: number | undefined;
    let almost: boolean | undefined;
    try {
      const res = await postLearnAnswer({
        sessionId: session.sessionId,
        wordId: item.wordId,
        exercise: item.exercise,
        responseMs,
        practice: item.isRepeat === true,
        ...payload,
      });
      correct = res.correct;
      correctIndex = res.correctIndex;
      almost = res.almost;
    } catch (err) {
      console.error('Learn answer failed:', err);
      return { correct: false };
    }

    const cursorAtAnswer = session.cursor;
    setTimeout(() => advanceLearnQueue(cursorAtAnswer, item, correct), revealDelayMs);

    return { correct, correctIndex, almost };
  },
  completeLearnSession: async () => {
    const session = get().learnSession;
    if (!session) throw new Error('No active learn session');
    const summary = await apiCompleteLearnSession(session.sessionId);
    set((s) => ({
      ...userToFields(summary.user),
      learnSession: s.learnSession ? { ...s.learnSession, status: 'summary', summary } : null,
    }));
    return summary;
  },
  abandonLearnSession: () => set({ learnSession: null }),

  // Daily quests
  dailyQuests: null,
  loadDailyQuests: async () => {
    const { quests } = await getTodayQuests();
    set({ dailyQuests: quests });
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
