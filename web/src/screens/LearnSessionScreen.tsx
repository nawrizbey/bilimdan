import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { HeartsBar } from '../components/HeartsBar';
import { ContentLoader } from '../components/ContentLoader';
import { playCorrect, playIncorrect } from '../lib/sound';
import { findActiveBlock } from '../lib/learnPath';
import type { LearnQueueItem } from '../types/api';
import { IntroCard } from './learn/IntroCard';
import { McqExercise } from './learn/McqExercise';
import { ListenPickExercise } from './learn/ListenPickExercise';
import { LetterTilesExercise } from './learn/LetterTilesExercise';
import { TypeExercise } from './learn/TypeExercise';
import { DictationExercise } from './learn/DictationExercise';
import { SpeakExercise } from './learn/SpeakExercise';
import { FillBlankExercise } from './learn/FillBlankExercise';
import { SessionSummary } from './learn/SessionSummary';
import type { ExerciseProps } from './learn/shared';

const EXERCISE_COMPONENTS: Record<LearnQueueItem['exercise'], (props: ExerciseProps) => React.JSX.Element> = {
  intro: IntroCard,
  mcq_en2kaa: McqExercise,
  mcq_kaa2en: McqExercise,
  listen_pick: ListenPickExercise,
  letter_tiles: LetterTilesExercise,
  type_en: TypeExercise,
  dictation: DictationExercise,
  speak: SpeakExercise,
  fill_blank: FillBlankExercise,
};

export function LearnSessionScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const learnSession = useAppStore((s) => s.learnSession);
  const learnPath = useAppStore((s) => s.learnPath);
  const settings = useAppStore((s) => s.settings);
  const resumeLearnSession = useAppStore((s) => s.resumeLearnSession);
  const answerCurrent = useAppStore((s) => s.answerCurrent);
  const abandonLearnSession = useAppStore((s) => s.abandonLearnSession);
  const startLearnSession = useAppStore((s) => s.startLearnSession);
  const loadLearnPath = useAppStore((s) => s.loadLearnPath);

  const [checking, setChecking] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [heartsToast, setHeartsToast] = useState(false);

  useEffect(() => {
    if (learnSession) {
      setChecking(false);
      return;
    }
    resumeLearnSession()
      .then((resumed) => {
        if (!resumed) navigate('/app/learn', { replace: true });
        setChecking(false);
      })
      .catch((err) => {
        console.error('Resume learn session failed:', err);
        navigate('/app/learn', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (learnSession?.status === 'summary') {
      loadLearnPath().catch((err) => console.error('Path refresh failed:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnSession?.status]);

  useEffect(() => {
    if (!learnSession || learnSession.heartsEmptyTick === 0) return;
    setHeartsToast(true);
    const timer = setTimeout(() => setHeartsToast(false), 1800);
    return () => clearTimeout(timer);
    // Deliberately keyed on the tick counter alone, not the whole (frequently-changing) session object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnSession?.heartsEmptyTick]);

  if (checking || !learnSession) return <ContentLoader />;

  const handleAnswer: ExerciseProps['onAnswer'] = async (payload, ms, revealDelayMs) => {
    const result = await answerCurrent(payload, ms, revealDelayMs);
    if (settings.sfx) (result.correct ? playCorrect : playIncorrect)();
    return result;
  };

  const handleExit = () => {
    abandonLearnSession();
    navigate('/app/learn', { replace: true });
  };

  const handleContinue = () => {
    const next = learnPath ? findActiveBlock(learnPath) : null;
    if (!next) {
      navigate('/app/learn', { replace: true });
      return;
    }
    startLearnSession({ type: 'lesson', unitId: next.unitId, lessonIndex: next.lessonIndex, block: next.block }).catch((err) => {
      console.error('Failed to start next block:', err);
      navigate('/app/learn', { replace: true });
    });
  };

  if (learnSession.status === 'summary') {
    if (!learnSession.summary) return <ContentLoader />;
    const hasNext = learnSession.type === 'lesson' && !!learnPath && !!findActiveBlock(learnPath);
    return (
      <SessionSummary
        summary={learnSession.summary}
        type={learnSession.type}
        hasNext={hasNext}
        onContinue={handleContinue}
        onBackToPath={handleExit}
      />
    );
  }

  const item = learnSession.queue[learnSession.cursor];
  if (!item) return <ContentLoader />;
  const ExerciseComponent = EXERCISE_COMPONENTS[item.exercise];
  const progressPct = Math.round((learnSession.cursor / learnSession.queue.length) * 100);

  return (
    <div className="max-w-[640px] mx-auto">
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-[#0F172A]/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-[20px] p-7 max-w-[360px] w-full text-center"
            style={{ boxShadow: '0 20px 50px rgba(15,23,42,.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[40px] mb-2">⚠️</div>
            <h3 className="font-display font-extrabold text-[19px] text-text mb-1">{t('learn.exitConfirmTitle')}</h3>
            <p className="text-[13.5px] font-bold text-text-softer mb-5">{t('learn.exitConfirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-border-3 text-[#475569] border-none rounded-[13px] py-[11px] font-display font-bold text-[14px] cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExit}
                className="flex-1 bg-danger text-white border-none rounded-[13px] py-[11px] font-display font-extrabold text-[14px] cursor-pointer"
              >
                {t('learn.exitConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={() => setShowExitConfirm(true)}
          aria-label={t('learn.exitConfirmTitle') ?? undefined}
          className="flex-none w-9 h-9 rounded-full bg-white border border-border-2 flex items-center justify-center text-text-softer cursor-pointer"
        >
          ✕
        </button>
        <div className="flex-1 h-3 bg-border-3 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="mb-5">
        <HeartsBar hearts={learnSession.hearts} maxHearts={learnSession.maxHearts} combo={learnSession.combo} />
      </div>

      {heartsToast && (
        <div className="mb-4 text-center bg-[#FEF2F2] border border-[#FECACA] text-danger-dark text-[13px] font-bold py-2 px-4 rounded-[12px] animate-pop">
          {t('learn.heartsEmpty')}
        </div>
      )}

      <ExerciseComponent key={`${item.wordId}-${item.exercise}-${learnSession.cursor}`} item={item} onAnswer={handleAnswer} />
    </div>
  );
}
