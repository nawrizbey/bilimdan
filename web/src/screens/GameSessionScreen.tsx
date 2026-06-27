import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { HeartsBar } from '../components/HeartsBar';
import { Confetti } from '../components/Confetti';

import { MemoryFlipPhase } from './learn/MemoryFlipPhase';
import { TrueFalsePhase } from './learn/TrueFalsePhase';
import { FillBlankPhase } from './learn/FillBlankPhase';
import { MissingLetterPhase } from './learn/MissingLetterPhase';
import { DictationPhase } from './learn/DictationPhase';
import { FlashcardSprintPhase } from './learn/FlashcardSprintPhase';
import { SentenceScramblePhase } from './learn/SentenceScramblePhase';
import { CategorySortPhase } from './learn/CategorySortPhase';

type GameType =
  | 'memory' | 'truefalse' | 'fillblank' | 'missing'
  | 'dictation' | 'sprint' | 'scramble' | 'category';

interface ApiWord {
  id: number;
  en: string;
  uz: string;
  emoji: string;
  ipa: string;
  example: string;
}

const GAME_META: Record<GameType, { title: string; emoji: string; color: string; isMulti: boolean }> = {
  memory:    { title: 'Xotira o\'yini',        emoji: '🃏', color: '#F59E0B', isMulti: true  },
  truefalse: { title: 'Tez javob',             emoji: '⚡', color: '#22C55E', isMulti: true  },
  fillblank: { title: 'Bo\'sh joyni to\'ldir', emoji: '📝', color: '#3B82F6', isMulti: false },
  missing:   { title: 'Harfni top',            emoji: '🔤', color: '#EC4899', isMulti: false },
  dictation: { title: 'Dıktant',               emoji: '🎧', color: '#3B82F6', isMulti: false },
  sprint:    { title: 'Tez yod al',            emoji: '⏱️', color: '#8B5CF6', isMulti: false },
  scramble:  { title: 'Gap tuzish',            emoji: '📋', color: '#06B6D4', isMulti: false },
  category:  { title: 'Saralama',              emoji: '🗂️', color: '#F97316', isMulti: true  },
};

function getDistractors(words: ApiWord[], wordId: number): string[] {
  const others = words.filter((w) => w.id !== wordId);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((w) => w.uz);
}

function scoreStars(correct: number, total: number): number {
  const pct = total === 0 ? 0 : correct / total;
  if (pct >= 0.8) return 3;
  if (pct >= 0.5) return 2;
  return 1;
}

export function GameSessionScreen() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const ensureCurrentUnit = useAppStore((s) => s.ensureCurrentUnit);

  const [words, setWords] = useState<ApiWord[]>([]);
  const [loading, setLoading] = useState(true);

  // single-word game state
  const [wordIdx, setWordIdx] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  const gameType = type as GameType;
  const meta = GAME_META[gameType];

  useEffect(() => {
    (async () => {
      await ensureCurrentUnit();
      setLoading(false);
    })();
  }, [ensureCurrentUnit]);

  useEffect(() => {
    if (currentUnitWords.length > 0) {
      setWords(currentUnitWords);
    }
  }, [currentUnitWords]);

  const handleCorrect = useCallback(() => {
    setCorrect((c) => c + 1);
    setTotal((t) => t + 1);
    setCombo((c) => c + 1);
    const next = wordIdx + 1;
    if (next >= words.length) {
      setDone(true);
    } else {
      setWordIdx(next);
    }
  }, [wordIdx, words.length]);

  const handleWrong = useCallback(() => {
    setTotal((t) => t + 1);
    setCombo(0);
    setHearts((h) => {
      const next = h - 1;
      if (next <= 0) {
        setDone(true);
        return 0;
      }
      return next;
    });
    const next = wordIdx + 1;
    if (next >= words.length) {
      setDone(true);
    } else {
      setWordIdx(next);
    }
  }, [wordIdx, words.length]);

  const handleSkip = useCallback(() => {
    setTotal((t) => t + 1);
    setCombo(0);
    const next = wordIdx + 1;
    if (next >= words.length) {
      setDone(true);
    } else {
      setWordIdx(next);
    }
  }, [wordIdx, words.length]);

  const handleMultiComplete = useCallback((c: number, t: number) => {
    setCorrect(c);
    setTotal(t);
    setDone(true);
  }, []);

  const handleMultiSkip = useCallback(() => {
    setDone(true);
  }, []);

  const handleRestart = () => {
    setWordIdx(0);
    setHearts(3);
    setCombo(0);
    setCorrect(0);
    setTotal(0);
    setDone(false);
  };

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-[48px]">❓</div>
        <div className="font-bold text-text">Noma'lum o'yin turi</div>
        <button
          onClick={() => navigate('/app/battle')}
          className="px-6 py-3 rounded-[14px] bg-primary text-white font-bold"
        >
          Orqaga
        </button>
      </div>
    );
  }

  if (loading || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="text-[48px]">{meta.emoji}</div>
        {loading ? (
          <div className="text-[15px] font-bold text-text-softer">Yuklanmoqda...</div>
        ) : (
          <>
            <div className="font-display font-extrabold text-[20px] text-text text-center">
              Avval dars tanlang
            </div>
            <div className="text-[14px] font-bold text-text-softer text-center max-w-[280px]">
              O'yin o'ynash uchun Darslarda birini tanlang
            </div>
            <button
              onClick={() => navigate('/app/lessons')}
              className="px-6 py-3 rounded-[14px] font-bold text-white"
              style={{ background: meta.color }}
            >
              Darslarga o'tish
            </button>
          </>
        )}
      </div>
    );
  }

  if (done) {
    const stars = scoreStars(correct, total);
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 max-w-[400px] mx-auto text-center">
        {stars === 3 && <Confetti active />}
        <div className="text-[64px] leading-none">{meta.emoji}</div>
        <div className="font-display font-extrabold text-[28px] text-text">
          {stars === 3 ? 'Ajoyib!' : stars === 2 ? 'Yaxshi!' : 'Davom eting!'}
        </div>

        {/* Stars */}
        <div className="flex gap-2 text-[36px]">
          {[1, 2, 3].map((s) => (
            <span key={s} style={{ opacity: s <= stars ? 1 : 0.25 }}>⭐</span>
          ))}
        </div>

        {/* Score card */}
        <div className="w-full bg-white border-2 border-border rounded-[20px] p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[22px] font-extrabold text-text">{correct}</div>
              <div className="text-[11px] font-bold text-text-softer">To'g'ri</div>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-border">
              <div className="text-[22px] font-extrabold text-text">{pct}%</div>
              <div className="text-[11px] font-bold text-text-softer">Natija</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[22px] font-extrabold text-text">{total}</div>
              <div className="text-[11px] font-bold text-text-softer">Jami</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleRestart}
            className="w-full py-[14px] rounded-[14px] font-extrabold text-[15px] text-white"
            style={{ background: meta.color }}
          >
            🔄 Qayta o'ynash
          </button>
          <button
            onClick={() => navigate('/app/battle')}
            className="w-full py-[14px] rounded-[14px] font-extrabold text-[15px] text-text bg-white border-2 border-border"
          >
            ← O'yinlarga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Header shown for single-word games
  const showHeader = !meta.isMulti;
  const currentWord = words[wordIdx];
  const distractors = getDistractors(words, currentWord?.id ?? -1);

  return (
    <div className="max-w-[540px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/app/battle')}
          className="w-9 h-9 rounded-[10px] bg-white border border-border flex items-center justify-center text-text-softer hover:text-text transition-colors flex-none"
          aria-label="Orqaga"
        >
          ←
        </button>
        <div className="flex-1 font-display font-extrabold text-[18px] text-text">
          {meta.emoji} {meta.title}
        </div>
        {showHeader && (
          <div className="text-[13px] font-bold text-text-softer">
            {wordIdx + 1}/{words.length}
          </div>
        )}
      </div>

      {showHeader && (
        <div className="mb-5">
          <HeartsBar hearts={hearts} maxHearts={3} combo={combo} />
        </div>
      )}

      {/* Game */}
      {gameType === 'memory' && (
        <MemoryFlipPhase
          words={words.slice(0, Math.min(8, words.length))}
          onComplete={handleMultiComplete}
          onSkip={handleMultiSkip}
        />
      )}
      {gameType === 'truefalse' && (
        <TrueFalsePhase
          words={words}
          onComplete={handleMultiComplete}
          onSkip={handleMultiSkip}
        />
      )}
      {gameType === 'category' && (
        <CategorySortPhase
          words={words.slice(0, Math.min(8, words.length))}
          onComplete={handleMultiComplete}
          onSkip={handleMultiSkip}
        />
      )}
      {gameType === 'fillblank' && currentWord && (
        <FillBlankPhase
          word={currentWord}
          distractors={distractors}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={wordIdx}
          totalWords={words.length}
        />
      )}
      {gameType === 'missing' && currentWord && (
        <MissingLetterPhase
          word={currentWord}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={wordIdx}
          totalWords={words.length}
        />
      )}
      {gameType === 'dictation' && currentWord && (
        <DictationPhase
          word={currentWord}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={wordIdx}
          totalWords={words.length}
        />
      )}
      {gameType === 'sprint' && currentWord && (
        <FlashcardSprintPhase
          word={currentWord}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={wordIdx}
          totalWords={words.length}
        />
      )}
      {gameType === 'scramble' && currentWord && (
        <SentenceScramblePhase
          word={currentWord}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onSkip={handleSkip}
          wordIndex={wordIdx}
          totalWords={words.length}
        />
      )}
    </div>
  );
}
