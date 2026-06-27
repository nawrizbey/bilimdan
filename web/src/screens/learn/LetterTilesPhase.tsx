import { useEffect, useRef, useState } from 'react';
import { speak } from '../../lib/speech';

interface Word {
  en: string;
  uz: string;
  emoji: string;
  ipa: string;
}

interface Props {
  word: Word;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  wordIndex: number;
  totalWords: number;
}

interface Tile {
  id: number;
  letter: string;
  used: boolean;
}

type AnswerSlot = { tileId: number | null };

const DISTRACTOR_POOL = ['t', 'r', 's', 'n', 'i', 'o', 'h', 'd', 'c', 'f', 'g', 'm'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTiles(word: string): Tile[] {
  const letters = word.toLowerCase().split('');
  const wordLetterSet = new Set(letters);
  const available = DISTRACTOR_POOL.filter((l) => !wordLetterSet.has(l));
  const numDistractors = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const distractors = shuffle(available).slice(0, numDistractors);
  const allLetters = shuffle([...letters, ...distractors]);
  return allLetters.map((letter, id) => ({ id, letter, used: false }));
}

export function LetterTilesPhase({
  word,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [tiles, setTiles] = useState<Tile[]>(() => generateTiles(word.en));
  const [answer, setAnswer] = useState<AnswerSlot[]>(() =>
    Array(word.en.length)
      .fill(null)
      .map(() => ({ tileId: null })),
  );
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);
  const [correctPop, setCorrectPop] = useState(false);

  // Used to cancel pending timeouts on wordIndex change
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when the word changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTiles(generateTiles(word.en));
    setAnswer(
      Array(word.en.length)
        .fill(null)
        .map(() => ({ tileId: null })),
    );
    setResult(null);
    setCorrectPop(false);
  }, [wordIndex, word.en]);

  // Build a quick lookup: tileId → tile
  const tileById = new Map(tiles.map((t) => [t.id, t]));

  // Auto-check when every slot is filled
  useEffect(() => {
    if (result !== null) return;
    if (answer.length === 0) return;
    if (!answer.every((s) => s.tileId !== null)) return;

    const userWord = answer
      .map((s) => tileById.get(s.tileId!)?.letter ?? '')
      .join('')
      .toLowerCase();
    const target = word.en.toLowerCase();

    if (userWord === target) {
      setResult('correct');
      setCorrectPop(true);
      speak(word.en);
      timerRef.current = setTimeout(() => onCorrect(), 1200);
    } else {
      setResult('wrong');
      timerRef.current = setTimeout(() => onWrong(), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  // Tap a letter tile → put it in the first empty slot
  function handleTileTap(tileId: number) {
    if (result !== null) return;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || tile.used) return;

    const firstEmpty = answer.findIndex((s) => s.tileId === null);
    if (firstEmpty === -1) return;

    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: true } : t)),
    );
    setAnswer((prev) => {
      const next = [...prev];
      next[firstEmpty] = { tileId };
      return next;
    });
  }

  // Tap a filled answer slot → remove that letter back to the pool
  function handleAnswerTap(slotIdx: number) {
    if (result !== null) return;
    const slot = answer[slotIdx];
    if (slot.tileId === null) return;

    const tileId = slot.tileId;
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: false } : t)),
    );
    setAnswer((prev) => {
      const next = [...prev];
      next[slotIdx] = { tileId: null };
      return next;
    });
  }

  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';

  function slotStyle(filled: boolean, idx: number): React.CSSProperties {
    let bg = filled ? '#F3E8FF' : 'transparent';
    let border = `2px ${filled ? 'solid' : 'dashed'} ${filled ? '#8B5CF6' : '#E9D5FF'}`;
    let color = '#7C3AED';
    let transform = 'scale(1)';
    let transitionDelay = '0ms';

    if (isCorrect && filled) {
      bg = '#DCFCE7';
      border = '2px solid #22C55E';
      color = '#15803D';
      transform = correctPop ? 'scale(1.1)' : 'scale(1)';
      transitionDelay = `${idx * 55}ms`;
    } else if (isWrong && filled) {
      bg = '#FEE2E2';
      border = '2px solid #EF4444';
      color = '#DC2626';
    }

    return {
      width: 52,
      height: 52,
      borderRadius: 14,
      border,
      background: bg,
      color,
      fontSize: 22,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      cursor: filled && result === null ? 'pointer' : 'default',
      transition: 'all .2s ease',
      transitionDelay,
      transform,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };
  }

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[#F3E8FF] text-[#7C3AED] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        ✦ So'z qurish
      </div>

      {/* Progress */}
      <div className="text-[13.5px] font-bold text-text-softer mb-5">
        {wordIndex + 1} / {totalWords}
      </div>

      {/* Card */}
      <div
        className="bg-white border border-border-2 rounded-[26px] p-6 pb-7"
        style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
      >
        {/* Emoji + prompt */}
        <div className="text-[58px] mb-1 leading-none">{word.emoji}</div>
        <div className="text-[11px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-[6px]">
          Inglizsha qanday aytiladi?
        </div>
        <div className="font-display font-extrabold text-[34px] text-text mb-7 leading-tight">
          {word.uz}
        </div>

        {/* Answer slots */}
        <div
          className={`flex justify-center gap-[6px] flex-wrap mb-2 ${isWrong ? 'animate-shake' : ''}`}
        >
          {answer.map((slot, idx) => {
            const letter =
              slot.tileId !== null
                ? (tileById.get(slot.tileId)?.letter ?? null)
                : null;
            const filled = letter !== null;
            return (
              <button
                // Keying on tileId causes a remount (re-animation) whenever the letter changes
                key={`slot-${idx}-${slot.tileId ?? 'empty'}`}
                onClick={() => handleAnswerTap(idx)}
                disabled={!filled || result !== null}
                aria-label={
                  filled
                    ? `${letter!.toUpperCase()} harfini olib tashlash`
                    : "Bo'sh joy"
                }
                className={filled ? 'animate-pop' : ''}
                style={slotStyle(filled, idx)}
              >
                {filled ? letter!.toUpperCase() : ''}
              </button>
            );
          })}
        </div>

        {/* Feedback messages */}
        {isCorrect && (
          <div className="text-[15px] font-extrabold text-[#15803D] mt-3 mb-1 animate-pop">
            To'g'ri! 🎉
          </div>
        )}
        {isWrong && (
          <div className="text-[14px] font-extrabold text-text-soft mt-3 mb-1 animate-pop">
            To'g'ri javob:{' '}
            <span
              className="font-display text-[17px] tracking-widest"
              style={{ color: '#15803D' }}
            >
              {word.en.toUpperCase()}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border-2 mt-5 mb-5" />

        {/* Letter tile pool */}
        <div className="flex justify-center gap-[8px] flex-wrap">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileTap(tile.id)}
              disabled={tile.used || result !== null}
              aria-label={
                tile.used ? undefined : `${tile.letter.toUpperCase()} harfini tanlash`
              }
              aria-hidden={tile.used}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                border: `2px solid ${tile.used ? '#EDE9FE' : '#C4B5FD'}`,
                background: tile.used ? '#F9F5FF' : '#F3E8FF',
                color: tile.used ? 'transparent' : '#7C3AED',
                fontSize: 22,
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                cursor: tile.used ? 'default' : 'pointer',
                transition: 'all .15s ease',
                boxShadow: tile.used ? 'none' : '0 3px 0 #C4B5FD',
                flexShrink: 0,
              }}
            >
              {tile.used ? '' : tile.letter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Skip */}
      {result === null && (
        <div className="mt-4 text-left">
          <button
            onClick={onSkip}
            className="bg-transparent border-none text-[13px] font-bold text-text-softer cursor-pointer hover:text-text-soft transition-colors"
          >
            O'tkazib yuborish
          </button>
        </div>
      )}
    </div>
  );
}
