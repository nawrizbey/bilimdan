import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { MascotIcon } from '../components/MascotIcon';
import { Confetti } from '../components/Confetti';
import { useAppStore } from '../store/useAppStore';
import { findActiveBlock } from '../lib/learnPath';
import type { DailyQuest } from '../types/api';

const SESSION_MINUTES_CAP = 20;

// Mon–Sun labels (Dúysenbi…Yekshenbi first letters, same across uz/kaa)
const DAY_LABELS = ['D', 'S', 'C', 'P', 'J', 'S', 'Y'] as const;

type DayState = 'done' | 'today' | 'upcoming' | 'missed';

/** Builds a 7-element Mon→Sun week row from the user's live streak data.
 * - today   → dashed yellow ring
 * - done    → solid green (within streak window)
 * - missed  → muted red (past day, outside streak)
 * - upcoming → grey (future day this week)
 */
function buildWeekDays(streak: number, goalDoneToday: number): { label: string; state: DayState }[] {
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  // Convert to Mon-based index (0=Mon..6=Sun)
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
  // If the user has been active today, streak includes today; otherwise streak covers days-before-today.
  const activeToday = goalDoneToday > 0;
  const doneBack = activeToday ? streak - 1 : streak; // how many days back (from today) are "done"

  return DAY_LABELS.map((label, i) => {
    const diff = i - todayIdx; // negative=past, 0=today, positive=future
    if (diff === 0) return { label, state: 'today' };
    if (diff > 0) return { label, state: 'upcoming' };
    const daysAgo = -diff;
    return { label, state: daysAgo <= doneBack ? 'done' : 'missed' };
  });
}

const dayStyle: Record<DayState, string> = {
  done: 'bg-primary text-white',
  today: 'bg-[#FEF3C7] text-[#B45309] border-2 border-dashed border-[#F59E0B]',
  missed: 'bg-[#FEE2E2] text-[#FCA5A5]',
  upcoming: 'bg-border-3 text-[#CBD5E1]',
};

const QUEST_META: Record<DailyQuest['key'], { icon: string; labelKey: string; color: string; bg: string }> = {
  blocks: { icon: '🧩', labelKey: 'dashboard.questBlocks', color: '#3B82F6', bg: '#EFF6FF' },
  newWords: { icon: '🆕', labelKey: 'dashboard.questNewWords', color: '#8B5CF6', bg: '#F5F3FF' },
  correct: { icon: '🎯', labelKey: 'dashboard.questCorrect', color: '#22C55E', bg: '#F0FDF4' },
};

const rankBadgeStyle = (i: number) => {
  if (i === 0) return { background: '#FACC15', color: '#0F172A' };
  if (i === 1) return { background: '#CBD5E1', color: '#0F172A' };
  if (i === 2) return { background: '#F59E0B', color: '#fff' };
  return { background: 'rgba(255,255,255,.1)', color: '#94A3B8' };
};

export function DashboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const studentName = useAppStore((s) => s.studentName);
  const streak = useAppStore((s) => s.streak);
  const goalMin = useAppStore((s) => s.goalMin);
  const goalDone = useAppStore((s) => s.goalDone);
  const wordsKnownCount = useAppStore((s) => s.wordsKnownCount);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const loadLeaderboard = useAppStore((s) => s.loadLeaderboard);
  const learnPath = useAppStore((s) => s.learnPath);
  const loadLearnPath = useAppStore((s) => s.loadLearnPath);
  const dailyQuests = useAppStore((s) => s.dailyQuests);
  const loadDailyQuests = useAppStore((s) => s.loadDailyQuests);
  const goalPct = Math.min(100, Math.round((goalDone / goalMin) * 100));
  const remaining = Math.max(0, goalMin - goalDone);
  const activeLesson = learnPath ? findActiveBlock(learnPath) : null;
  const activeUnit = activeLesson ? learnPath!.units.find((u) => u.id === activeLesson.unitId) : undefined;
  const activeLessonWordsCount = activeUnit?.lessons[activeLesson!.lessonIndex]?.wordsCount ?? 0;
  const dueCount = learnPath?.dueCount ?? 0;
  const weekDays = buildWeekDays(streak, goalDone);

  const [leaderboardError, setLeaderboardError] = useState(false);
  const loadLeaderboardWidget = () => {
    loadLeaderboard('school').catch((err) => {
      console.error('Dashboard leaderboard load failed:', err);
      setLeaderboardError(true);
    });
  };
  const retryLeaderboardWidget = () => {
    setLeaderboardError(false);
    loadLeaderboardWidget();
  };

  useEffect(() => {
    loadLeaderboardWidget();
    loadLearnPath().catch((err) => console.error('Dashboard learn path load failed:', err));
    loadDailyQuests().catch((err) => console.error('Dashboard quests load failed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fires a brief confetti burst the moment any quest flips from
  // not-done to done (comparing against the previously loaded snapshot,
  // not a real-time push — Dashboard only refetches quests on mount/focus).
  const prevQuestsRef = useRef<DailyQuest[] | null>(null);
  const [questCelebration, setQuestCelebration] = useState(false);
  useEffect(() => {
    if (!dailyQuests) return;
    const prev = prevQuestsRef.current;
    if (prev) {
      const newlyDone = dailyQuests.some((q) => q.done && !prev.find((p) => p.key === q.key)?.done);
      if (newlyDone) {
        setQuestCelebration(true);
        setTimeout(() => setQuestCelebration(false), 2500);
      }
    }
    prevQuestsRef.current = dailyQuests;
  }, [dailyQuests]);

  const ringCircumference = 251;
  const ringOffset = ringCircumference - (ringCircumference * goalPct) / 100;

  return (
    <div className="animate-pop max-w-[1180px]">
      <Confetti active={questCelebration} />
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-[26px] p-6 sm:p-[32px_36px] flex flex-col sm:flex-row items-center gap-6"
        style={{
          background: 'linear-gradient(125deg,#22C55E 0%,#16A34A 60%,#15803D 100%)',
          boxShadow: '0 18px 40px rgba(22,163,74,.32)',
        }}
      >
        <div className="absolute -right-10 -top-[50px] w-[230px] h-[230px] rounded-full bg-white/[.08]" />
        <div className="absolute right-[120px] -bottom-[70px] w-[170px] h-[170px] rounded-full bg-white/[.07]" />
        <div className="flex-1 relative z-10 text-center sm:text-left">
          <div className="inline-block bg-white/20 text-white font-extrabold text-[12px] py-[5px] px-3 rounded-[20px] mb-3">
            {t('dashboard.welcomeBadge')}
          </div>
          <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] text-white mb-[6px]">
            {t('dashboard.greeting', { name: studentName })}
          </h1>
          <p className="text-white/90 text-[15px] font-semibold mb-5 max-w-[440px]">
            {dueCount > 0 ? (
              <Trans i18nKey="dashboard.minutesLeftWithReview" values={{ remaining, count: dueCount }} components={{ b: <b /> }} />
            ) : activeUnit ? (
              <Trans i18nKey="dashboard.minutesLeftWithUnit" values={{ remaining, unit: activeUnit.title }} components={{ b: <b /> }} />
            ) : (
              <Trans i18nKey="dashboard.minutesLeft" values={{ remaining }} components={{ b: <b /> }} />
            )}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            <button
              onClick={() => navigate('/app/learn')}
              className="bg-white text-[#16A34A] font-display font-extrabold text-[15px] border-none rounded-[14px] py-[13px] px-6 cursor-pointer"
              style={{ boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}
            >
              {t('dashboard.continueBtn')}
            </button>
            <button
              onClick={() => navigate('/app/battle')}
              className="bg-white/[.16] text-white font-display font-bold text-[15px] border-2 border-white/40 rounded-[14px] py-[11px] px-[22px] cursor-pointer"
            >
              {t('dashboard.battleBtn')}
            </button>
          </div>
        </div>
        <div className="flex-none w-[140px] sm:w-[180px] relative z-10 animate-floaty">
          <MascotIcon size={180} className="w-full h-auto" />
        </div>
      </div>

      {/* STAT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr] gap-[18px] mt-[18px]">
        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] flex items-center gap-5 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="relative w-24 h-24 flex-none">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#EEF2F7" strokeWidth="11" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#22C55E"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display font-extrabold text-[22px] text-[#16A34A] leading-none">{goalPct}%</div>
              <div className="text-[10px] font-bold text-text-softer">{t('dashboard.goalRingLabel')}</div>
            </div>
          </div>
          <div>
            <div className="text-[13px] font-bold text-text-softer">{t('dashboard.todayLesson')}</div>
            <div className="font-display font-extrabold text-[26px] text-text">
              {goalDone} <span className="text-[15px] text-text-softer">/ {goalMin} {t('common.minutes')}</span>
            </div>
            <div className="text-[12.5px] font-bold text-primary mt-[2px]">{t('dashboard.great')}</div>
          </div>
        </div>

        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-[#FFF7ED] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 2c1 4-2 5-2 8a4 4 0 008 0c0-1-1-3-1-3 2 1 3 3 3 6a8 8 0 11-16 0c0-5 5-7 8-11z" />
              </svg>
            </div>
            <div className="text-[13px] font-bold text-text-softer">{t('dashboard.streakDays')}</div>
          </div>
          <div className="font-display font-extrabold text-[34px] text-text leading-none">
            {streak} <span className="text-[16px] text-text-softer">{t('dashboard.day')}</span>
          </div>
          <div className="flex gap-[5px] mt-3">
            {weekDays.map((d, i) => (
              <div
                key={i}
                className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[12px] font-extrabold ${dayStyle[d.state]}`}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-[#EFF6FF] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
              </svg>
            </div>
            <div className="text-[13px] font-bold text-text-softer">{t('dashboard.totalWords')}</div>
          </div>
          <div className="font-display font-extrabold text-[34px] text-text leading-none">
            {wordsKnownCount} <span className="text-[16px] text-text-softer">{t('common.words')}</span>
          </div>
          <div className="text-[12.5px] font-bold text-secondary mt-[10px]">{t('dashboard.keepGoing')}</div>
        </div>
      </div>

      {/* DAILY QUESTS */}
      {dailyQuests && (
        <div className="bg-white border border-border-2 rounded-[22px] p-6 mt-[18px] shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <h3 className="font-display font-extrabold text-[19px] text-text m-0 mb-4">{t('dashboard.questsTitle')}</h3>
          <div className="flex flex-col gap-3">
            {dailyQuests.map((q) => {
              const meta = QUEST_META[q.key];
              const pct = Math.min(100, Math.round((q.current / q.target) * 100));
              return (
                <div key={q.key} className="flex items-center gap-[14px]">
                  <div
                    className="w-11 h-11 flex-none rounded-[13px] flex items-center justify-center text-[20px]"
                    style={{ background: meta.bg }}
                  >
                    {q.done ? '✅' : meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-[6px]">
                      <span className="font-extrabold text-[14px] text-text truncate">{t(meta.labelKey)}</span>
                      <span
                        className="text-[12px] font-extrabold flex-none whitespace-nowrap"
                        style={{ color: q.done ? '#16A34A' : meta.color }}
                      >
                        {q.done ? t('dashboard.questDone') : t('dashboard.questXp', { xp: q.xp })}
                      </span>
                    </div>
                    <div className="h-2 bg-border-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: q.done ? '#22C55E' : meta.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOWER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[18px] mt-[18px]">
        <div className="bg-white border border-border-2 rounded-[22px] p-6 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-[19px] text-text m-0">{t('dashboard.todayLessons')}</h3>
            <span className="text-[12.5px] font-bold text-text-softer">{t('dashboard.aboutMinutes')}</span>
          </div>
          <div className="flex flex-col gap-[11px]">
            <div
              onClick={() => navigate('/app/learn')}
              className="flex items-center gap-[14px] p-[14px] border border-[#DCFCE7] bg-[#F0FDF4] rounded-[16px] cursor-pointer"
            >
              <div className="w-12 h-12 flex-none rounded-[13px] bg-primary flex items-center justify-center text-[22px]">📖</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-text truncate">
                  {t('nav.learn')}{activeUnit ? ` — ${activeUnit.title.replace(/^\d+-tema\s*—\s*/, '')}` : ''}
                </div>
                <div className="text-[12.5px] font-bold text-[#16A34A]">
                  {activeLesson
                    ? t('dashboard.wordCountWithMinutes', { count: activeLessonWordsCount, mins: Math.min(activeLessonWordsCount, SESSION_MINUTES_CAP) })
                    : t('dashboard.wordsPreparing')}
                </div>
              </div>
              <div className="font-extrabold text-[13px] text-primary bg-[#DCFCE7] flex-none whitespace-nowrap py-[6px] px-3 rounded-[20px]">{t('dashboard.start')}</div>
            </div>
            <div
              onClick={() => navigate('/app/quiz')}
              className="flex items-center gap-[14px] p-[14px] border border-[#FEF3C7] bg-[#FFFBEB] rounded-[16px] cursor-pointer"
            >
              <div className="w-12 h-12 flex-none rounded-[13px] bg-quiz flex items-center justify-center text-[22px]">✅</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-text truncate">{t('dashboard.dailyQuiz')}</div>
                <div className="text-[12.5px] font-bold text-[#B45309]">{t('dashboard.quizMeta')}</div>
              </div>
              <div className="font-extrabold text-[13px] text-quiz bg-[#FEF3C7] flex-none whitespace-nowrap py-[6px] px-3 rounded-[20px]">{t('dashboard.start')}</div>
            </div>
          </div>
        </div>

        <div
          className="rounded-[22px] p-6 text-white"
          style={{ background: 'linear-gradient(160deg,#1E293B,#0F172A)', boxShadow: '0 10px 26px rgba(15,23,42,.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-[18px] text-white m-0">{t('dashboard.schoolLeaderboard')}</h3>
            <span className="text-[11px] font-extrabold text-[#FACC15] bg-[#FACC15]/[.15] py-1 px-[9px] rounded-[20px]">TOP 5</span>
          </div>
          <div className="flex flex-col gap-[9px]">
            {leaderboardError ? (
              <div className="text-center py-2">
                <div className="text-[13px] font-bold text-white/60 mb-2">{t('common.loadError')}</div>
                <button
                  onClick={retryLeaderboardWidget}
                  className="text-[12px] font-extrabold text-white bg-white/10 border border-white/20 rounded-[10px] py-[6px] px-3 cursor-pointer font-sans"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : !leaderboard ? (
              <div className="text-[13px] font-bold text-white/60 py-2">{t('common.loading')}</div>
            ) : (
              leaderboard.board.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-[11px] py-[9px] px-[11px] rounded-[13px]"
                  style={{
                    background: p.isMe ? 'rgba(34,197,94,.16)' : 'rgba(255,255,255,.05)',
                    border: p.isMe ? '1px solid rgba(34,197,94,.4)' : 'none',
                  }}
                >
                  <span
                    className="w-6 h-6 flex-none rounded-[8px] flex items-center justify-center font-extrabold text-[12px]"
                    style={rankBadgeStyle(p.rank - 1)}
                  >
                    {p.rank}
                  </span>
                  <span className="flex-1 min-w-0 truncate font-bold text-[14px]" style={{ color: p.isMe ? '#86EFAC' : '#fff' }}>
                    {p.name}{p.isMe ? ` ${t('common.you')}` : ''}
                  </span>
                  <span className="font-extrabold text-[13px] text-[#FACC15] flex-none">{p.xp}</span>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate('/app/leaders')}
            className="w-full mt-[14px] bg-white/10 text-white border border-white/[.18] rounded-[12px] py-[10px] font-bold text-[13px] cursor-pointer font-sans"
          >
            {t('dashboard.seeFullLeaderboard')}
          </button>
        </div>
      </div>
    </div>
  );
}
