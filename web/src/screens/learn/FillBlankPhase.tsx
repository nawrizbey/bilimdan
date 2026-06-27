import { useEffect, useRef, useState } from 'react';

interface Word {
  id: number;
  en: string;
  uz: string;
  emoji: string;
  ipa: string;
  example: string;
}

interface Props {
  word: Word;
  distractors: string[];
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  wordIndex: number;
  totalWords: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace all case-insensitive whole-word occurrences of `en` with `___`.
 *  Returns the blanked string and whether replacement succeeded. */
function blankSentence(example: string, en: string): { sentence: string; ok: boolean } {
  if (!example || !example.trim()) return { sentence: '', ok: false };
  const pattern = new RegExp(`\\b${escapeRegex(en)}\\b`, 'gi');
  if (!pattern.test(example)) return { sentence: example, ok: false };
  return {
    sentence: example.replace(new RegExp(`\\b${escapeRegex(en)}\\b`, 'gi'), '___'),
    ok: true,
  };
}

// ─── Sentence renderer ────────────────────────────────────────────────────────

interface SentenceProps {
  sentence: string;
  revealed: boolean;
  en: string;
}

function SentenceDisplay({ sentence, revealed, en }: SentenceProps) {
  const parts = sentence.split('___');
  return (
    <p className="font-bold text-[17px] text-text leading-relaxed m-0">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 &&
            (revealed ? (
              <span className="font-display font-extrabold text-[20px] text-[#15803D] px-1">
                {en}
              </span>
            ) : (
              <span className="font-display font-extrabold text-[20px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-[6px] mx-1 inline-block leading-snug">
                ___
              </span>
            ))}
        </span>
      ))}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FillBlankPhase({
  word,
  distractors,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [options, setOptions] = useState<string[]>(() =>
    shuffle([word.en, ...distractors.slice(0, 3)]),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when word changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOptions(shuffle([word.en, ...distractors.slice(0, 3)]));
    setSelected(null);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, word.en]);

  // Derive display sentence
  const { sentence: blanked, ok } = blankSentence(word.example ?? '', word.en);
  const displaySentence: string = ok
    ? blanked
    : word.example?.trim()
    ? word.example.trimEnd() + ' ___'
    : 'Bu sózden gáp dúziń: ___';

  const correctIndex = options.indexOf(word.en);

  function handlePick(idx: number) {
    if (result !== null) return;
    setSelected(idx);
    if (options[idx] === word.en) {
      setResult('correct');
      timerRef.current = setTimeout(() => onCorrect(), 800);
    } else {
      setResult('wrong');
      timerRef.current = setTimeout(() => onWrong(), 1200);
    }
  }

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge + Progress */}
      <div className="flex items-center justify-between mb-[10px]">
        <div className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#15803D] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          📝 Bo'sh joyni to'ldiriñ
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
        {/* Emoji */}
        <div className="text-[48px] mb-1 leading-none">{word.emoji}</div>

        {/* UZ hint */}
        <div className="text-[14px] font-bold text-text-soft mb-5">{word.uz}</div>

        {/* Sentence card */}
        <div className="bg-[#F8FAFC] border border-border-2 rounded-[20px] p-5 mb-5 text-left">
          <SentenceDisplay sentence={displaySentence} revealed={result !== null} en={word.en} />
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[10px]">
          {options.map((opt, i) => {
            let bg = '#F8FAFC';
            let bd = '#E8EDF3';
            let col = '#0F172A';
            let bbg = '#E2E8F0';
            let bcol = '#64748B';

            if (selected !== null) {
              if (i === correctIndex) {
                bg = '#DCFCE7';
                bd = '#22C55E';
                col = '#15803D';
                bbg = '#22C55E';
                bcol = '#fff';
              } else if (i === selected && result === 'wrong') {
                bg = '#FEE2E2';
                bd = '#EF4444';
                col = '#DC2626';
                bbg = '#EF4444';
                bcol = '#fff';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
                style={{
                  background: bg,
                  borderColor: bd,
                  color: col,
                  cursor: selected !== null ? 'default' : 'pointer',
                }}
              >
                <span
                  className="w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center font-extrabold text-[14px] mr-[13px]"
                  style={{ background: bbg, color: bcol }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {result === 'correct' && (
          <div className="text-[15px] font-extrabold text-[#15803D] mt-4 animate-pop">
            To'g'ri! 🎉
          </div>
        )}
        {result === 'wrong' && (
          <div className="text-[14px] font-extrabold text-text-soft mt-4 animate-pop">
            To'g'ri javob:{' '}
            <span className="font-display text-[17px]" style={{ color: '#15803D' }}>
              {word.en}
            </span>
          </div>
        )}
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
