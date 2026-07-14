import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';
import type { LearnLessonStatus, LearnUnitStatus } from '../types/api';

// Cycled per unit for visual variety — same palette used across the rest of the app.
const UNIT_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6'];
// Gentle left/right sway so the lesson row reads as a winding path, not a straight column.
const WAVE_OFFSETS = [0, 46, 64, 46, 0, -46, -64, -46];

type NodeState = 'done' | 'active' | 'locked';

function lessonState(unit: LearnUnitStatus, lesson: LearnLessonStatus, foundActive: { value: boolean }): NodeState {
  if (lesson.complete) return 'done';
  if (unit.locked) return 'locked';
  if (!foundActive.value) {
    foundActive.value = true;
    return 'active';
  }
  return 'locked';
}

export function LearnScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const learnPath = useAppStore((s) => s.learnPath);
  const loadLearnPath = useAppStore((s) => s.loadLearnPath);
  const startLearnSession = useAppStore((s) => s.startLearnSession);

  const [starting, setStarting] = useState(false);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const unitRefs = useRef(new Map<number, HTMLDivElement>());

  useEffect(() => {
    loadLearnPath().catch((err) => console.error('Learn path load failed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scrollToUnit = (location.state as { scrollToUnit?: number } | null)?.scrollToUnit;
    if (scrollToUnit != null) {
      unitRefs.current.get(scrollToUnit)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnPath]);

  const showLockedToast = (key: string) => {
    setShakeKey(key);
    setToast(t('learn.lockedToast'));
    setTimeout(() => setShakeKey(null), 400);
    setTimeout(() => setToast(null), 1800);
  };

  const handleLessonClick = (unit: LearnUnitStatus, lesson: LearnLessonStatus, state: NodeState) => {
    if (starting) return;
    if (state === 'locked') {
      showLockedToast(`${unit.id}-${lesson.index}`);
      return;
    }
    setStarting(true);
    startLearnSession({ type: 'lesson', unitId: unit.id, lessonIndex: lesson.index })
      .then(() => navigate('/app/learn/session'))
      .catch((err) => {
        console.error('Failed to start lesson:', err);
        setStarting(false);
      });
  };

  const handleReviewClick = () => {
    if (starting) return;
    setStarting(true);
    startLearnSession({ type: 'review' })
      .then(() => navigate('/app/learn/session'))
      .catch((err) => {
        console.error('Failed to start review:', err);
        setStarting(false);
      });
  };

  if (!learnPath) return <ContentLoader />;

  const foundActive = { value: false };
  const globalIndexByKey = new Map(
    learnPath.units
      .flatMap((unit) => unit.lessons.map((lesson) => `${unit.id}-${lesson.index}`))
      .map((key, i) => [key, i] as const),
  );

  return (
    <div className="animate-pop max-w-[640px] mx-auto relative pb-16">
      <h2 className="font-display font-extrabold text-[25px] text-text mb-1">{t('learn.title')}</h2>

      {learnPath.dueCount > 0 && (
        <button
          onClick={handleReviewClick}
          disabled={starting}
          className="w-full flex items-center gap-4 mt-4 mb-2 p-[18px] rounded-[20px] border-2 border-[#FDE68A] bg-[#FFFBEB] cursor-pointer text-left disabled:opacity-60"
        >
          <div className="w-12 h-12 flex-none rounded-[14px] bg-[#F59E0B] flex items-center justify-center text-[22px]">🔁</div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-extrabold text-[16px] text-[#92400E]">{t('learn.reviewTitle')}</div>
            <div className="text-[13px] font-bold text-[#B45309]">{t('learn.reviewDue', { count: learnPath.dueCount })}</div>
          </div>
          <div className="font-extrabold text-[13px] text-white bg-[#F59E0B] flex-none whitespace-nowrap py-[8px] px-4 rounded-[20px]">
            {t('learn.reviewStart')}
          </div>
        </button>
      )}

      <div className="flex flex-col items-center mt-8">
        {learnPath.units.map((unit, unitIdx) => {
          const color = UNIT_COLORS[unitIdx % UNIT_COLORS.length];
          return (
            <div key={unit.id} className="w-full flex flex-col items-center">
              <div
                ref={(el) => {
                  if (el) unitRefs.current.set(unit.id, el);
                }}
                className="flex items-center gap-3 py-[10px] px-4 rounded-[16px] mb-6 mt-2"
                style={{ background: unit.locked ? '#F1F5F9' : `${color}1A` }}
              >
                <span className="text-[22px]" style={{ filter: unit.locked ? 'grayscale(1)' : 'none' }}>
                  {unit.emoji}
                </span>
                <span
                  className="font-display font-extrabold text-[15px]"
                  style={{ color: unit.locked ? '#94A3B8' : color }}
                >
                  {unit.title}
                </span>
                {unit.complete && (
                  <span className="text-[11px] font-extrabold text-white bg-primary py-[3px] px-[9px] rounded-[20px]">
                    ✓ {t('learn.unitComplete')}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-5 mb-4">
                {unit.lessons.map((lesson) => {
                  const state = lessonState(unit, lesson, foundActive);
                  const key = `${unit.id}-${lesson.index}`;
                  const offset = WAVE_OFFSETS[(globalIndexByKey.get(key) ?? 0) % WAVE_OFFSETS.length];

                  return (
                    <button
                      key={key}
                      ref={state === 'active' ? activeRef : undefined}
                      onClick={() => handleLessonClick(unit, lesson, state)}
                      disabled={starting && state !== 'locked'}
                      style={{
                        transform: `translateX(${offset}px)`,
                        background: state === 'done' ? color : state === 'active' ? color : undefined,
                        borderColor: state === 'done' || state === 'active' ? color : undefined,
                        boxShadow: state === 'done' || state === 'active' ? `0 6px 0 ${color}88` : undefined,
                      }}
                      className={`relative flex-none w-16 h-16 rounded-full border-4 flex items-center justify-center text-[24px] font-display font-extrabold cursor-pointer disabled:cursor-not-allowed ${
                        state === 'locked' ? 'bg-border-3 border-border-2 text-text-softer' : 'text-white'
                      } ${state === 'active' ? 'animate-pulse' : ''} ${shakeKey === key ? 'animate-shake' : ''}`}
                      aria-label={t('learn.lessonLabel', { n: lesson.index + 1 })}
                    >
                      {state === 'done' ? '✓' : state === 'locked' ? '🔒' : lesson.index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text text-white font-bold text-[13px] py-[10px] px-5 rounded-[20px] shadow-lg z-30">
          {toast}
        </div>
      )}
    </div>
  );
}
