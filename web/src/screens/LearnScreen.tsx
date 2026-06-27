import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type LearnPhase } from '../store/useAppStore';
import { speak } from '../lib/speech';
import { ContentLoader } from '../components/ContentLoader';
import { HeartsBar } from '../components/HeartsBar';
import { Confetti } from '../components/Confetti';
import { FamiliarizePhase } from './learn/FamiliarizePhase';
import { WritePhase } from './learn/WritePhase';
import { SpeakPhase } from './learn/SpeakPhase';
import { TestPhase } from './learn/TestPhase';
import { SummaryPhase } from './learn/SummaryPhase';
import { LetterTilesPhase } from './learn/LetterTilesPhase';
import { MatchPairsPhase } from './learn/MatchPairsPhase';
import type { ApiWord } from '../types/api';

// ── Exercise queue ────────────────────────────────────────────────────────────

type NewExercise =
  | { type: 'letterTiles'; wordIdx: number }
  | { type: 'matchPairs'; wordIdxs: number[] };

function buildExercises(words: ApiWord[]): NewExercise[] {
  const N = words.length;
  if (N === 0) return [];
  const exs: NewExercise[] = words.map((_, i) => ({ type: 'letterTiles', wordIdx: i }));
  if (N >= 2) {
    exs.push({ type: 'matchPairs', wordIdxs: Array.from({ length: Math.min(6, N) }, (_, i) => i) });
  }
  return exs;
}

// ── Extended 5-step stepper ───────────────────────────────────────────────────

const EXT_STEPS = [
  { id: 'familiarize', label: 'Tanishish', emoji: '📖', color: '#22C55E' },
  { id: 'practice',   label: 'Mashq',     emoji: '✦',  color: '#8B5CF6' },
  { id: 'write',      label: 'Yozish',    emoji: '✍️', color: '#3B82F6' },
  { id: 'speak',      label: 'Gapirish',  emoji: '🎙️', color: '#A855F7' },
  { id: 'test',       label: 'Test',      emoji: '✅', color: '#F59E0B' },
];

function getActiveStepIdx(phase: LearnPhase, newExDone: boolean): number {
  if (phase === 'familiarize') return 0;
  if (phase === 'write' && !newExDone) return 1;
  if (phase === 'write') return 2;
  if (phase === 'speak') return 3;
  if (phase === 'test') return 4;
  return -1; // summary — all done
}

function ExtStepper({ phase, newExDone }: { phase: LearnPhase; newExDone: boolean }) {
  const activeIdx = getActiveStepIdx(phase, newExDone);
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3 mb-7">
      {EXT_STEPS.map((step, i) => {
        const done = phase === 'summary' || i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={step.id} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-extrabold transition-all duration-300"
                style={{
                  background: done ? step.color : active ? `${step.color}22` : '#F1F5F9',
                  color: done ? '#fff' : active ? step.color : '#94A3B8',
                  border: active ? `2.5px solid ${step.color}` : '2px solid transparent',
                  boxShadow: active ? `0 0 0 4px ${step.color}18` : 'none',
                }}
              >
                {done ? '✓' : step.emoji}
              </div>
              <span
                className="text-[9.5px] sm:text-[10.5px] font-extrabold hidden sm:block"
                style={{ color: active ? step.color : done ? '#64748B' : '#CBD5E1' }}
              >
                {step.label}
              </span>
            </div>
            {i < EXT_STEPS.length - 1 && (
              <div
                className="w-3 sm:w-7 h-[2px] rounded-full transition-all duration-500"
                style={{ background: i < activeIdx ? step.color : '#E8EDF3' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function LearnScreen() {
  const navigate = useNavigate();

  // Store state
  const learnPhase    = useAppStore((s) => s.learnPhase);
  const currentUnitTitle = useAppStore((s) => s.currentUnitTitle);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const loadingUnitWords = useAppStore((s) => s.loadingUnitWords);
  const ensureCurrentUnit = useAppStore((s) => s.ensureCurrentUnit);
  const card              = useAppStore((s) => s.card);
  const flipCard          = useAppStore((s) => s.flipCard);
  const nextCardLocal     = useAppStore((s) => s.nextCardLocal);
  const prevCard          = useAppStore((s) => s.prevCard);
  const familiarizeViewed = useAppStore((s) => s.familiarizeViewed);
  const writeIdx          = useAppStore((s) => s.writeIdx);
  const learnSpeakIdx     = useAppStore((s) => s.learnSpeakIdx);
  const testIdx           = useAppStore((s) => s.testIdx);
  const testQuestions     = useAppStore((s) => s.testQuestions);

  // New exercise local state
  const [exercises, setExercises] = useState<NewExercise[]>([]);
  const [newExIdx,  setNewExIdx]  = useState(0);
  const [newExDone, setNewExDone] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [combo,  setCombo]  = useState(0);

  useEffect(() => { ensureCurrentUnit(); }, [ensureCurrentUnit]);

  // Rebuild exercise queue whenever the word list changes (e.g. new unit)
  useEffect(() => {
    if (currentUnitWords.length === 0) return;
    const built = buildExercises(currentUnitWords);
    setExercises(built);
    setNewExIdx(0);
    setNewExDone(built.length === 0);
    setHearts(3);
    setCombo(0);
  }, [currentUnitWords]);

  // Keyboard shortcuts (familiarize only)
  useEffect(() => {
    if (learnPhase !== 'familiarize') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const word = currentUnitWords[card];
      if (!word) return;
      if (e.key === 'ArrowRight') nextCardLocal();
      else if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === ' ') { e.preventDefault(); flipCard(); }
      else if (e.key === 's' || e.key === 'S') speak(word.en);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [learnPhase, card, currentUnitWords, nextCardLocal, prevCard, flipCard]);

  // ── Exercise callbacks ──────────────────────────────────────────────────────

  const advance = useCallback((exLength: number) => {
    setNewExIdx((i) => {
      const next = i + 1;
      if (next >= exLength) setNewExDone(true);
      return next;
    });
  }, []);

  const handleCorrect = useCallback(() => {
    setCombo((c) => c + 1);
    advance(exercises.length);
  }, [exercises.length, advance]);

  const handleWrong = useCallback(() => {
    setHearts((h) => Math.max(0, h - 1));
    setCombo(0);
    advance(exercises.length);
  }, [exercises.length, advance]);

  const handleSkip = useCallback(() => {
    advance(exercises.length);
  }, [exercises.length, advance]);

  const handleMatchComplete = useCallback((correctCount: number, totalCount: number) => {
    if (correctCount < totalCount) { setHearts((h) => Math.max(0, h - 1)); setCombo(0); }
    else setCombo((c) => c + 1);
    advance(exercises.length);
  }, [exercises.length, advance]);

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (loadingUnitWords) return <ContentLoader />;

  if (currentUnitWords.length === 0) {
    return (
      <div className="animate-pop max-w-[760px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10">
        <div className="text-[48px] mb-2">📚</div>
        <h2 className="font-display font-extrabold text-[22px] text-text mb-1">So'zlar yo'q</h2>
        <p className="text-[14px] font-bold text-text-softer">Bu bo'limda hozircha so'zlar qo'shilmagan.</p>
      </div>
    );
  }

  // ── Progress calculation ────────────────────────────────────────────────────

  const total = currentUnitWords.length;
  const isNewExPhase = learnPhase === 'write' && !newExDone;

  let overallPct = 0;
  if (learnPhase === 'familiarize') {
    overallPct = Math.round((familiarizeViewed.length / total) * 20);
  } else if (isNewExPhase) {
    overallPct = 20 + Math.round((newExIdx / (exercises.length || 1)) * 20);
  } else if (learnPhase === 'write') {
    overallPct = 40 + Math.round((writeIdx / total) * 20);
  } else if (learnPhase === 'speak') {
    overallPct = 60 + Math.round((learnSpeakIdx / total) * 20);
  } else if (learnPhase === 'test') {
    overallPct = 80 + Math.round((testIdx / (testQuestions.length || 1)) * 20);
  } else if (learnPhase === 'summary') {
    overallPct = 100;
  }

  // ── Render new exercise ─────────────────────────────────────────────────────

  const renderNewExercise = () => {
    const ex = exercises[newExIdx];
    if (!ex) return null;

    if (ex.type === 'letterTiles') {
      const word = currentUnitWords[ex.wordIdx];
      if (!word) return null;
      return (
        <LetterTilesPhase
          word={word}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={newExIdx}
          totalWords={exercises.length}
        />
      );
    }

    if (ex.type === 'matchPairs') {
      const words = ex.wordIdxs.map((i) => currentUnitWords[i]).filter(Boolean);
      return (
        <MatchPairsPhase
          words={words}
          onComplete={handleMatchComplete}
          onSkip={handleSkip}
        />
      );
    }

    return null;
  };

  // ── Layout ──────────────────────────────────────────────────────────────────

  const showHeartsBar = learnPhase !== 'familiarize' && learnPhase !== 'summary';
  const animKey = isNewExPhase ? `new-${newExIdx}` : learnPhase;

  return (
    <div className="max-w-[820px] mx-auto">
      <Confetti active={learnPhase === 'summary'} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-extrabold text-[22px] sm:text-[24px] m-0 text-text">
          {currentUnitTitle}
        </h2>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="text-[12.5px] font-bold text-text-softer bg-white border border-border-2 py-[7px] px-[13px] rounded-[13px] cursor-pointer hover:border-text-soft transition-colors"
        >
          ← Orqaga
        </button>
      </div>

      <ExtStepper phase={learnPhase} newExDone={newExDone} />

      {/* Hearts + combo bar */}
      {showHeartsBar && (
        <div className="mb-4">
          <HeartsBar hearts={hearts} maxHearts={3} combo={combo} />
        </div>
      )}

      {/* Progress bar */}
      <div className="h-[5px] bg-border rounded-[20px] overflow-hidden mb-7 max-w-[360px] mx-auto">
        <div
          className="h-full rounded-[20px] transition-[width] duration-500 ease-out"
          style={{
            width: `${overallPct}%`,
            background: 'linear-gradient(90deg,#22C55E,#8B5CF6,#F59E0B)',
          }}
        />
      </div>

      {/* Phase content */}
      <div key={animKey} className="animate-pop">
        {learnPhase === 'familiarize' && <FamiliarizePhase />}
        {isNewExPhase             && renderNewExercise()}
        {learnPhase === 'write' && newExDone && <WritePhase />}
        {learnPhase === 'speak'   && <SpeakPhase />}
        {learnPhase === 'test'    && <TestPhase />}
        {learnPhase === 'summary' && <SummaryPhase />}
      </div>
    </div>
  );
}
