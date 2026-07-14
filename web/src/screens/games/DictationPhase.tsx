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

export function DictationPhase({
  word,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerPlay(text: string) {
    speak(text);
    setIsPlaying(true);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => setIsPlaying(false), 2000);
  }

  useEffect(() => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);

    setInput('');
    setResult(null);
    setIsPlaying(false);

    // Capture current word so the closure is never stale
    const currentEn = word.en;

    const mountTimer = setTimeout(() => {
      speak(currentEn);
      setIsPlaying(true);
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 2000);
      setTimeout(() => inputRef.current?.focus(), 350);
    }, 300);

    return () => {
      clearTimeout(mountTimer);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, word.id]);

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

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1D4ED8] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        🎧 Dıktant
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
        {/* Speaker button */}
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => triggerPlay(word.en)}
            aria-label="So'zni tinglash"
            className="relative flex items-center justify-center"
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: '#EFF6FF',
              border: '2px solid #BFDBFE',
              boxShadow: isPlaying ? '0 0 0 8px rgba(59,130,246,0.15)' : 'none',
              transition: 'box-shadow .3s ease',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {isPlaying && (
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(191,219,254,0.45)' }}
              />
            )}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        {/* IPA hint */}
        {word.ipa && (
          <div className="text-[14px] text-text-softer font-bold mb-1">{word.ipa}</div>
        )}

        {/* Instruction */}
        <div className="text-[11px] font-extrabold text-text-softer tracking-[.08em] uppercase mb-5">
          Sózdı inglizsha jazıń
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

          {/* Feedback messages */}
          {isCorrect && (
            <div className="text-[15px] font-extrabold text-[#15803D] mb-4 animate-pop">
              Duris! 🎉
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

          {/* Replay button — visible only before submitting */}
          {result === null && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => triggerPlay(word.en)}
                className="inline-flex items-center gap-[6px] text-[13px] font-bold text-[#3B82F6] border border-[#BFDBFE] bg-[#EFF6FF] rounded-[10px] py-[6px] px-[12px] cursor-pointer hover:bg-[#DBEAFE] transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                Qayta tinglash
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={result !== null || !input.trim()}
            className="w-full bg-[#3B82F6] text-white border-none rounded-[15px] py-[14px] font-display font-extrabold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 5px 0 #2563EB' }}
          >
            Tekserıw
          </button>
        </form>
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
