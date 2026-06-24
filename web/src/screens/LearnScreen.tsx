import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore, type LearnPhase } from '../store/useAppStore';
import { speak } from '../lib/speech';
import { ContentLoader } from '../components/ContentLoader';
import { FamiliarizePhase } from './learn/FamiliarizePhase';
import { WritePhase } from './learn/WritePhase';
import { SpeakPhase } from './learn/SpeakPhase';
import { TestPhase } from './learn/TestPhase';
import { SummaryPhase } from './learn/SummaryPhase';

const STEPS: { phase: LearnPhase; labelKey: string; emoji: string; color: string }[] = [
  { phase: 'familiarize', labelKey: 'learn.stepFamiliarize', emoji: '📖', color: '#22C55E' },
  { phase: 'write', labelKey: 'learn.stepWrite', emoji: '✍️', color: '#3B82F6' },
  { phase: 'speak', labelKey: 'learn.stepSpeak', emoji: '🎙️', color: '#8B5CF6' },
  { phase: 'test', labelKey: 'learn.stepTest', emoji: '✅', color: '#F59E0B' },
];

function Stepper({ phase }: { phase: LearnPhase }) {
  const { t } = useTranslation();
  const activeIdx = STEPS.findIndex((s) => s.phase === phase);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-7">
      {STEPS.map((step, i) => {
        const done = phase === 'summary' || i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={step.phase} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[16px] sm:text-[18px] font-extrabold transition-all"
                style={{
                  background: done ? step.color : active ? `${step.color}22` : '#F1F5F9',
                  color: done ? '#fff' : active ? step.color : '#94A3B8',
                  border: active ? `2px solid ${step.color}` : '2px solid transparent',
                }}
              >
                {done ? '✓' : step.emoji}
              </div>
              <span
                className="text-[10.5px] sm:text-[11.5px] font-extrabold hidden sm:block"
                style={{ color: active ? step.color : done ? '#64748B' : '#CBD5E1' }}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-5 sm:w-9 h-[2px] rounded-full" style={{ background: i < activeIdx ? step.color : '#E8EDF3' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const PHASE_ORDER: LearnPhase[] = ['familiarize', 'write', 'speak', 'test'];

export function LearnScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const learnPhase = useAppStore((s) => s.learnPhase);
  const currentUnitTitle = useAppStore((s) => s.currentUnitTitle);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const loadingUnitWords = useAppStore((s) => s.loadingUnitWords);
  const ensureCurrentUnit = useAppStore((s) => s.ensureCurrentUnit);
  const card = useAppStore((s) => s.card);
  const flipCard = useAppStore((s) => s.flipCard);
  const nextCardLocal = useAppStore((s) => s.nextCardLocal);
  const prevCard = useAppStore((s) => s.prevCard);
  const familiarizeViewed = useAppStore((s) => s.familiarizeViewed);
  const writeIdx = useAppStore((s) => s.writeIdx);
  const learnSpeakIdx = useAppStore((s) => s.learnSpeakIdx);
  const testIdx = useAppStore((s) => s.testIdx);

  useEffect(() => {
    ensureCurrentUnit();
  }, [ensureCurrentUnit]);

  useEffect(() => {
    if (learnPhase !== 'familiarize') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const word = currentUnitWords[card];
      if (!word) return;
      if (e.key === 'ArrowRight') nextCardLocal();
      else if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === ' ') {
        e.preventDefault();
        flipCard();
      } else if (e.key === 's' || e.key === 'S') speak(word.en);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [learnPhase, card, currentUnitWords, nextCardLocal, prevCard, flipCard]);

  if (loadingUnitWords) {
    return <ContentLoader />;
  }

  if (currentUnitWords.length === 0) {
    return (
      <div className="animate-pop max-w-[760px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10">
        <div className="text-[48px] mb-2">📚</div>
        <h2 className="font-display font-extrabold text-[22px] text-text mb-1">{t('learn.noWords')}</h2>
        <p className="text-[14px] font-bold text-text-softer">{t('learn.noWordsDesc')}</p>
      </div>
    );
  }

  const total = currentUnitWords.length || 1;
  const phaseIdx = PHASE_ORDER.indexOf(learnPhase);
  const completedFullPhases = phaseIdx === -1 ? 4 : phaseIdx;
  const withinPhase =
    learnPhase === 'familiarize'
      ? familiarizeViewed.length
      : learnPhase === 'write'
        ? writeIdx
        : learnPhase === 'speak'
          ? learnSpeakIdx
          : learnPhase === 'test'
            ? testIdx
            : 0;
  const overallPct = Math.min(100, Math.round(((completedFullPhases * total + withinPhase) / (total * 4)) * 100));

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-extrabold text-[22px] sm:text-[24px] m-0 text-text">{currentUnitTitle}</h2>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="text-[12.5px] font-bold text-text-softer bg-white border border-border-2 py-[7px] px-[13px] rounded-[13px] cursor-pointer"
        >
          {t('learn.back')}
        </button>
      </div>

      <Stepper phase={learnPhase} />

      <div className="h-[5px] bg-border rounded-[20px] overflow-hidden mb-7 max-w-[360px] mx-auto">
        <div
          className="h-full rounded-[20px] transition-[width] duration-500 ease-out"
          style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg,#22C55E,#8B5CF6,#F59E0B)' }}
        />
      </div>

      <div key={learnPhase} className="animate-pop">
        {learnPhase === 'familiarize' && <FamiliarizePhase />}
        {learnPhase === 'write' && <WritePhase />}
        {learnPhase === 'speak' && <SpeakPhase />}
        {learnPhase === 'test' && <TestPhase />}
        {learnPhase === 'summary' && <SummaryPhase />}
      </div>
    </div>
  );
}
