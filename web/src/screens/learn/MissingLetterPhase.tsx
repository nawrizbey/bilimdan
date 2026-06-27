import { useEffect, useRef, useState } from 'react';
import { speak } from '../../lib/speech';

interface Word {
  id: number;
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

interface PoolTile {
  id: number;
  letter: string;
  used: boolean;
}

const DISTRACTOR_POOL = ['t', 'r', 's', 'n', 'i', 'o', 'h', 'd', 'c', 'f', 'g', 'm'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick which letter positions to remove, never the first.
 *  Words ≤ 4 chars → remove 1; words ≥ 5 → remove 2.
 *  Prefers non-adjacent positions when removing 2. */
function pickMissingPositions(word: string): number[] {
  const len = word.length;
  if (len <= 1) return [];
  const count = len <= 4 ? 1 : 2;
  // Candidates: every index except 0
  const candidates = Array.from({ length: len - 1 }, (_, i) => i + 1);
  if (candidates.length <= count) return candidates.slice(0, count);

  if (count === 1) {
    return [candidates[Math.floor(Math.random() * candidates.length)]];
  }

  // For 2 removals: try to pick non-adjacent
  const shuffled = shuffle(candidates);
  const picked: number[] = [shuffled[0]];
  for (let k = 1; k < shuffled.length; k++) {
    if (Math.abs(shuffled[k] - picked[picked.length - 1]) > 1) {
      picked.push(shuffled[k]);
    }
    if (picked.length === count) break;
  }
  // Fallback: just take first `count` from shuffled
  if (picked.length < count) return shuffled.slice(0, count).sort((a, b) => a - b);
  return picked.sort((a, b) => a - b);
}

interface PhaseState {
  positions: number[];
  pool: PoolTile[];
  filledSlots: (number | null)[]; // indexed by blank order → tileId or null
  result: null | 'correct' | 'wrong';
}

function buildInitialState(en: string): PhaseState {
  const letters = en.toLowerCase();
  const positions = pickMissingPositions(letters);
  const missingLetters = positions.map((p) => letters[p]);

  // Distractor pool: letters not present anywhere in the word
  const wordLetterSet = new Set(letters.split(''));
  const available = DISTRACTOR_POOL.filter((l) => !wordLetterSet.has(l));
  const numDistractors = Math.min(2, available.length);
  const distractors = shuffle(available).slice(0, numDistractors);

  const allPoolLetters = shuffle([...missingLetters, ...distractors]);
  const pool: PoolTile[] = allPoolLetters.map((letter, id) => ({ id, letter, used: false }));

  return {
    positions,
    pool,
    filledSlots: Array<number | null>(positions.length).fill(null),
    result: null,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MissingLetterPhase({
  word,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [state, setState] = useState<PhaseState>(() => buildInitialState(word.en));
  const { positions, pool, filledSlots, result } = state;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when word changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(buildInitialState(word.en));
  }, [wordIndex, word.en]);

  // Build lookup: tileId → tile
  const tileById = new Map(pool.map((t) => [t.id, t]));

  // Auto-check when all blanks filled
  useEffect(() => {
    const { positions: pos, filledSlots: slots, result: res, pool: p } = state;
    if (res !== null) return;
    if (slots.length === 0) return;
    if (!slots.every((s) => s !== null)) return;

    const lookup = new Map(p.map((t) => [t.id, t]));
    const target = word.en.toLowerCase();
    const isCorrect = pos.every((position, blankIdx) => {
      const tileId = slots[blankIdx]!;
      return (lookup.get(tileId)?.letter ?? '') === target[position];
    });

    if (isCorrect) {
      setState((prev) => ({ ...prev, result: 'correct' }));
      speak(word.en);
      timerRef.current = setTimeout(() => onCorrect(), 1000);
    } else {
      setState((prev) => ({ ...prev, result: 'wrong' }));
      timerRef.current = setTimeout(() => onWrong(), 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filledSlots]);

  // Tap a pool tile → fill the first empty blank
  function handleTileTap(tileId: number) {
    if (result !== null) return;
    const tile = pool.find((t) => t.id === tileId);
    if (!tile || tile.used) return;
    const firstEmpty = filledSlots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;

    setState((prev) => ({
      ...prev,
      pool: prev.pool.map((t) => (t.id === tileId ? { ...t, used: true } : t)),
      filledSlots: prev.filledSlots.map((s, i) => (i === firstEmpty ? tileId : s)),
    }));
  }

  // Tap a filled blank → return tile to pool
  function handleBlankTap(blankIdx: number) {
    if (result !== null) return;
    const tileId = filledSlots[blankIdx];
    if (tileId === null) return;

    setState((prev) => ({
      ...prev,
      pool: prev.pool.map((t) => (t.id === tileId ? { ...t, used: false } : t)),
      filledSlots: prev.filledSlots.map((s, i) => (i === blankIdx ? null : s)),
    }));
  }

  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';

  function blankSlotStyle(filled: boolean, blankIdx: number): React.CSSProperties {
    let bg = 'transparent';
    let border = '2px dashed #F9A8D4';
    let color = '#9D174D';
    let transform = 'scale(1)';
    const transitionDelay = isCorrect ? `${blankIdx * 55}ms` : '0ms';

    if (filled) {
      bg = '#FCE7F3';
      border = '2px solid #EC4899';
      if (isCorrect) {
        bg = '#DCFCE7';
        border = '2px solid #22C55E';
        color = '#15803D';
        transform = 'scale(1.1)';
      } else if (isWrong) {
        bg = '#FEE2E2';
        border = '2px solid #EF4444';
        color = '#DC2626';
      }
    }

    return {
      width: 52,
      height: 52,
      borderRadius: 12,
      border,
      background: bg,
      color,
      fontSize: 22,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      cursor: filled && result === null ? 'pointer' : 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all .2s ease',
      transitionDelay,
      transform,
    };
  }

  const letters = word.en.toLowerCase().split('');

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge + Progress */}
      <div className="flex items-center justify-between mb-[10px]">
        <div className="inline-flex items-center gap-2 bg-[#FCE7F3] text-[#9D174D] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          🔤 Hárip tap
        </div>
        <span className="text-[13.5px] font-bold text-text-softer">
          {wordIndex + 1}/{totalWords}
        </span>
      </div>

      {/* Card */}
      <div
        className="bg-white border border-border-2 rounded-[26px] p-6 pb-7"
        style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
      >
        {/* Emoji + UZ label */}
        <div className="text-[56px] mb-1 leading-none">{word.emoji}</div>
        <div className="text-[14px] font-bold text-text-soft mb-6">{word.uz}</div>

        {/* Word display row */}
        <div
          className={`flex justify-center gap-[6px] flex-wrap mb-2 ${isWrong ? 'animate-shake' : ''}`}
        >
          {letters.map((letter, i) => {
            const blankIdx = positions.indexOf(i);
            if (blankIdx !== -1) {
              const tileId = filledSlots[blankIdx];
              const filled = tileId !== null;
              const filledLetter = filled ? (tileById.get(tileId!)?.letter ?? '') : '';
              return (
                <button
                  key={`blank-${i}-${tileId ?? 'empty'}`}
                  onClick={() => (filled ? handleBlankTap(blankIdx) : undefined)}
                  disabled={!filled || result !== null}
                  aria-label={
                    filled
                      ? `${filledLetter.toUpperCase()} harfini olib tashlash`
                      : "Bo'sh joy"
                  }
                  className={filled ? 'animate-pop' : ''}
                  style={blankSlotStyle(filled, blankIdx)}
                >
                  {filled ? filledLetter.toUpperCase() : ''}
                </button>
              );
            }
            return (
              <div
                key={`letter-${i}`}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  border: '2px solid transparent',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  fontSize: 22,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {letter.toUpperCase()}
              </div>
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

        {/* Letter pool */}
        <div className="flex justify-center gap-[8px] flex-wrap">
          {pool.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileTap(tile.id)}
              disabled={tile.used || result !== null}
              aria-label={tile.used ? undefined : `${tile.letter.toUpperCase()} harfini tanlash`}
              aria-hidden={tile.used}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                border: `2px solid ${tile.used ? '#FCE7F3' : '#F9A8D4'}`,
                background: tile.used ? '#FDF4FB' : '#FCE7F3',
                color: tile.used ? 'transparent' : '#9D174D',
                fontSize: 22,
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                cursor: tile.used ? 'default' : 'pointer',
                boxShadow: tile.used ? 'none' : '0 3px 0 #F9A8D4',
                flexShrink: 0,
                transition: 'all .15s ease',
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
