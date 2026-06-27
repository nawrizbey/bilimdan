import { useEffect, useRef, useState } from 'react';

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

const FLASH_DURATION = 2000;
const RING_RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function FlashcardSprintPhase({
  word,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [phase, setPhase] = useState<'flash' | 'type'>('flash');
  const [progress, setProgress] = useState(1); // 1 → 0 over FLASH_DURATION
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flash countdown + phase transition
  useEffect(() => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);

    setPhase('flash');
    setProgress(1);
    setInput('');
    setResult(null);

    const start = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.max(0, 1 - elapsed / FLASH_DURATION);
      setProgress(p);
      if (elapsed >= FLASH_DURATION) {
        clearInterval(intervalId);
        setPhase('type');
      }
    }, 50);

    return () => {
      clearInterval(intervalId);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, word.id]);

  // Auto-focus input when entering type phase
  useEffect(() => {
    if (phase === 'type') {
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [phase]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (result !== null) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === word.en.toLowerCase()) {
      setResult('correct');
      resultTimerRef.current = setTimeout(onCorrect, 900);
    } else {
      setResult('wrong');
      resultTimerRef.current = setTimeout(onWrong, 1300);
    }
  }

  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';

  // SVG ring: progress 1 = full ring, 0 = empty
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const secondsLeft = Math.ceil(progress * (FLASH_DURATION / 1000));

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[#F3E8FF] text-[#7C3AED] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        ⚡ Tez yod al
      </div>

      {/* Progress */}
      <div className="text-[13.5px] font-bold text-text-softer mb-5">
        {wordIndex + 1} / {totalWords}
      </div>

      {/* Card */}
      <div
        className="bg-white border border-border-2 rounded-[26px] p-8"
        style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
      >
        {phase === 'flash' ? (
          /* ── FLASH PHASE ── */
          <>
            {/* Countdown ring */}
            <div className="flex justify-center mb-4">
              <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
                <svg width="64" height="64">
                  {/* Track */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#EDE9FE"
                    strokeWidth="5"
                  />
                  {/* Depleting arc */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="5"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 32 32)"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 50ms linear' }}
                  />
                </svg>
                <span
                  className="absolute font-extrabold text-[14px]"
                  style={{ color: '#7C3AED' }}
                >
                  {secondsLeft}s
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div className="text-[11px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-4">
              Yaxshılap qaraŋ!
            </div>

            {/* Emoji */}
            <div className="text-[52px] mb-2 leading-none">{word.emoji}</div>

            {/* Big word */}
            <div
              className="font-display font-extrabold text-[64px] text-[#0F172A] leading-none mb-3"
              style={{ transition: 'opacity .3s ease' }}
            >
              {word.en}
            </div>

            {/* UZ translation */}
            <div className="text-[18px] font-bold text-text-soft">{word.uz}</div>
          </>
        ) : (
          /* ── TYPE PHASE ── */
          <>
            {/* Ghost of where word was */}
            <div className="flex justify-center mb-3">
              <span className="text-[52px] leading-none opacity-40">❓</span>
            </div>

            {/* Context: emoji + UZ stays visible */}
            <div className="text-[15px] font-extrabold text-text-soft mb-1">
              {word.emoji} {word.uz}
            </div>

            {/* Type prompt */}
            <div className="text-[11px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-5">
              Inglizsha jazıń
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={result !== null}
                placeholder="..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className={`w-full text-center py-[14px] px-[16px] border-2 rounded-[14px] font-display font-bold text-[22px] outline-none mb-3 ${
                  isWrong ? 'animate-shake' : ''
                }`}
                style={{
                  borderColor: isCorrect ? '#22C55E' : isWrong ? '#EF4444' : '#E8EDF3',
                  background: isCorrect ? '#F0FDF4' : isWrong ? '#FEF2F2' : '#F8FAFC',
                  color: isCorrect ? '#15803D' : isWrong ? '#DC2626' : '#0F172A',
                }}
              />

              {/* Feedback */}
              {isCorrect && (
                <div className="text-[15px] font-extrabold text-[#15803D] mb-4 animate-pop">
                  Ǵábirep kettińiz! 🎉
                </div>
              )}
              {isWrong && (
                <div className="text-[14px] font-extrabold text-text-soft mb-4 animate-pop">
                  To'g'ri javob:{' '}
                  <span
                    className="font-display text-[17px]"
                    style={{ color: '#15803D', fontWeight: 800 }}
                  >
                    {word.en}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={result !== null || !input.trim()}
                className="w-full bg-[#8B5CF6] text-white border-none rounded-[15px] py-[14px] font-display font-extrabold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 5px 0 #7C3AED' }}
              >
                Tekserıw
              </button>
            </form>
          </>
        )}
      </div>

      {/* Skip — available in both phases as long as no result */}
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
