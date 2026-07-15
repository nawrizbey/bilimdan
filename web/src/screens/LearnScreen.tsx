import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';
import type { BlockKey, LearnLessonStatus, LearnUnitStatus } from '../types/api';

// Cycled per unit for visual variety — same palette used across the rest of the app.
const UNIT_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6'];

const BLOCK_ICON: Record<BlockKey, string> = {
  intro: '📖',
  listen: '🎧',
  translate: '🌐',
  letters: '🔤',
  speak: '🎤',
  write: '⌨️',
};

const BLOCK_LABEL_KEY: Record<BlockKey, string> = {
  intro: 'learn.blockIntro',
  listen: 'learn.blockListen',
  translate: 'learn.blockTranslate',
  letters: 'learn.blockLetters',
  speak: 'learn.blockSpeak',
  write: 'learn.blockWrite',
};

/** A lesson row is only reachable at all if its unit isn't locked and every
 * earlier lesson in the unit is complete — mirrors the server's
 * `isLessonStartable` (see server/src/lib/learnQueue.ts). Individual block
 * lock/unlock *within* a reachable row comes straight from `block.locked`. */
function isLessonReachable(unit: LearnUnitStatus, lessonIndex: number): boolean {
  if (unit.locked) return false;
  if (lessonIndex === 0) return true;
  return unit.lessons[lessonIndex - 1].complete;
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
  const activeRowRef = useRef<HTMLDivElement | null>(null);
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
      activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnPath]);

  const showLockedToast = (key: string) => {
    setShakeKey(key);
    setToast(t('learn.lockedToast'));
    setTimeout(() => setShakeKey(null), 400);
    setTimeout(() => setToast(null), 1800);
  };

  const handleBlockClick = (unit: LearnUnitStatus, lesson: LearnLessonStatus, block: BlockKey, unlocked: boolean) => {
    if (starting) return;
    const key = `${unit.id}-${lesson.index}-${block}`;
    if (!unlocked) {
      showLockedToast(key);
      return;
    }
    setStarting(true);
    startLearnSession({ type: 'lesson', unitId: unit.id, lessonIndex: lesson.index, block })
      .then(() => navigate('/app/learn/session'))
      .catch((err) => {
        console.error('Failed to start block:', err);
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

  let foundActiveRow = false;

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

      <div className="flex flex-col mt-8">
        {learnPath.units.map((unit, unitIdx) => {
          const color = UNIT_COLORS[unitIdx % UNIT_COLORS.length];
          return (
            <div key={unit.id} className="w-full flex flex-col">
              <div
                ref={(el) => {
                  if (el) unitRefs.current.set(unit.id, el);
                }}
                className="flex items-center gap-3 py-[10px] px-4 rounded-[16px] mb-4 mt-2 self-start"
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

              <div className="flex flex-col gap-4 mb-6">
                {unit.lessons.map((lesson) => {
                  const reachable = isLessonReachable(unit, lesson.index);
                  const doneCount = lesson.blocks.filter((b) => b.done).length;
                  const pct = Math.round((doneCount / lesson.blocks.length) * 100);
                  const isActiveRow = reachable && !lesson.complete && !foundActiveRow;
                  if (isActiveRow) foundActiveRow = true;

                  return (
                    <div
                      key={lesson.index}
                      ref={isActiveRow ? activeRowRef : undefined}
                      className="flex flex-col gap-[6px]"
                    >
                      <div className="text-[11.5px] font-extrabold text-text-softer px-[2px]">
                        {t('learn.lessonLabel', { n: lesson.index + 1 })}
                      </div>
                      <div className="flex items-center gap-[9px] flex-wrap">
                        {lesson.blocks.map((block) => {
                          const unlocked = reachable && !block.locked;
                          const key = `${unit.id}-${lesson.index}-${block.key}`;
                          return (
                            <button
                              key={block.key}
                              onClick={() => handleBlockClick(unit, lesson, block.key, unlocked)}
                              disabled={starting && unlocked}
                              style={{
                                background: block.done || unlocked ? color : undefined,
                                borderColor: block.done || unlocked ? color : undefined,
                                boxShadow: block.done || unlocked ? `0 4px 0 ${color}88` : undefined,
                              }}
                              className={`relative flex-none w-[52px] h-[52px] rounded-[16px] border-2 flex items-center justify-center text-[21px] cursor-pointer disabled:cursor-not-allowed transition-transform ${
                                !block.done && !unlocked ? 'bg-border-3 border-border-2 text-text-softer' : 'text-white'
                              } ${shakeKey === key ? 'animate-shake' : ''}`}
                              aria-label={t(BLOCK_LABEL_KEY[block.key]) ?? undefined}
                            >
                              {block.done ? '✓' : !unlocked ? '🔒' : BLOCK_ICON[block.key]}
                            </button>
                          );
                        })}

                        <div
                          className="flex-none w-[52px] h-[52px] rounded-[16px] border-2 flex flex-col items-center justify-center gap-0 select-none"
                          style={{
                            background: lesson.complete ? `${color}1A` : '#F8FAFC',
                            borderColor: lesson.complete ? color : '#E8EDF3',
                          }}
                          aria-label={t('learn.blockFinish') ?? undefined}
                        >
                          <span className="text-[14px] leading-none" style={{ color: lesson.complete ? color : '#94A3B8' }}>
                            {lesson.complete ? '🏁' : `${pct}%`}
                          </span>
                        </div>
                      </div>
                    </div>
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
