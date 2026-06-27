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
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  wordIndex: number;
  totalWords: number;
}

interface Token {
  id: number;
  text: string;
  placed: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTokens(example: string, wordEn: string): Token[] {
  const raw = example.trim().split(/\s+/).filter(Boolean);
  // Fall back to a simple phrase if the example is empty or too short
  const texts = raw.length >= 3 ? raw : [wordEn, 'is', 'a', 'word'];
  // Each token's id is its original position — used to reconstruct the correct order
  const indexed: Token[] = texts.map((text, id) => ({ id, text, placed: false }));
  return shuffle(indexed);
}

export function SentenceScramblePhase({
  word,
  onCorrect,
  onWrong,
  onSkip,
  wordIndex,
  totalWords,
}: Props) {
  const [tokens, setTokens] = useState<Token[]>(() =>
    buildTokens(word.example, word.en),
  );
  // Ordered list of token IDs as placed by the user
  const [answer, setAnswer] = useState<number[]>([]);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when the word changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTokens(buildTokens(word.example, word.en));
    setAnswer([]);
    setResult(null);
  }, [wordIndex, word.example, word.en]);

  // Quick lookup: token id → token
  const tokenById = new Map(tokens.map((t) => [t.id, t]));

  // Reconstruct the original sentence by sorting tokens back to their original positions
  const originalSentence = [...tokens]
    .sort((a, b) => a.id - b.id)
    .map((t) => t.text)
    .join(' ');

  const allPlaced = tokens.length > 0 && answer.length === tokens.length;
  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';

  function handlePoolTap(id: number) {
    if (result !== null) return;
    const token = tokenById.get(id);
    if (!token || token.placed) return;

    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, placed: true } : t)),
    );
    setAnswer((prev) => [...prev, id]);
  }

  function handleAnswerTap(idx: number) {
    if (result !== null) return;
    const id = answer[idx];
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, placed: false } : t)),
    );
    setAnswer((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCheck() {
    if (!allPlaced || result !== null) return;

    const userSentence = answer
      .map((id) => tokenById.get(id)?.text ?? '')
      .join(' ');

    if (userSentence.toLowerCase().trim() === originalSentence.toLowerCase().trim()) {
      setResult('correct');
      timerRef.current = setTimeout(() => onCorrect(), 1200);
    } else {
      setResult('wrong');
      timerRef.current = setTimeout(() => onWrong(), 1500);
    }
  }

  function answerTokenStyle(idx: number) {
    if (isCorrect) {
      return {
        background: '#DCFCE7',
        border: '2px solid #22C55E',
        color: '#15803D',
        transitionDelay: `${idx * 50}ms`,
      };
    }
    if (isWrong) {
      return {
        background: '#FEE2E2',
        border: '2px solid #EF4444',
        color: '#DC2626',
      };
    }
    return {
      background: '#FFFFFF',
      border: '2px solid #06B6D4',
      color: '#164E63',
    };
  }

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[#ECFEFF] text-[#164E63] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        📋 Gápti túziń
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
        {/* Context clue: emoji + Karakalpak word so the user knows the topic */}
        <div className="text-[52px] leading-none mb-1">{word.emoji}</div>
        <div className="font-display font-extrabold text-[22px] text-text mb-5 leading-tight">
          {word.uz}
        </div>

        {/* Answer area ------------------------------------------------- */}
        <div className={`mb-3 ${isWrong ? 'animate-shake' : ''}`}>
          {answer.length === 0 ? (
            /* Empty state: dashed placeholder */
            <div
              className="min-h-[52px] rounded-[12px] flex items-center justify-center text-[13px] font-bold text-text-softer"
              style={{ border: '2px dashed #A5F3FC' }}
            >
              Sózlerdi tanlań...
            </div>
          ) : (
            /* Placed tokens — horizontal scrollable row that also wraps */
            <div className="overflow-x-auto">
              <div className="flex gap-[6px] flex-wrap justify-center py-1 min-h-[44px]">
                {answer.map((id, idx) => {
                  const token = tokenById.get(id);
                  return (
                    <button
                      key={`ans-${id}`}
                      onClick={() => handleAnswerTap(idx)}
                      disabled={result !== null}
                      className="rounded-[10px] py-[8px] px-[12px] font-bold text-[15px] transition-all duration-200 flex-shrink-0 cursor-pointer"
                      style={answerTokenStyle(idx)}
                    >
                      {token?.text ?? ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feedback messages ------------------------------------------ */}
        {isCorrect && (
          <div className="text-[15px] font-extrabold text-[#15803D] mb-3 animate-pop">
            Durıs! 🎉
          </div>
        )}
        {isWrong && (
          <div className="text-[14px] font-extrabold text-text-soft mb-3 animate-pop">
            Durıs jawap:{' '}
            <span className="font-display text-[15px]" style={{ color: '#15803D' }}>
              {originalSentence}
            </span>
          </div>
        )}

        {/* Check button — only visible when every token is placed */}
        {result === null && allPlaced && (
          <button
            onClick={handleCheck}
            className="w-full py-[14px] rounded-[14px] font-display font-bold text-[16px] text-white mb-4 cursor-pointer"
            style={{ background: '#06B6D4', boxShadow: '0 3px 0 #0891B2' }}
          >
            Tekseriw
          </button>
        )}

        {/* Divider */}
        <div className="border-t border-border-2 mt-3 mb-4" />

        {/* Token pool ------------------------------------------------- */}
        {/* Placed tokens stay in the DOM (invisible) to prevent layout jumps */}
        <div className="flex gap-[8px] flex-wrap justify-center">
          {tokens.map((token) => (
            <button
              key={token.id}
              onClick={() => handlePoolTap(token.id)}
              disabled={token.placed || result !== null}
              aria-hidden={token.placed}
              style={{
                borderRadius: 10,
                border: `2px solid ${token.placed ? 'transparent' : '#A5F3FC'}`,
                background: token.placed ? 'transparent' : '#ECFEFF',
                color: token.placed ? 'transparent' : '#164E63',
                fontSize: 15,
                fontWeight: 700,
                padding: '8px 12px',
                boxShadow: token.placed ? 'none' : '0 2px 0 #A5F3FC',
                cursor: token.placed ? 'default' : 'pointer',
                pointerEvents: token.placed ? 'none' : 'auto',
                transition: 'color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease',
                flexShrink: 0,
              }}
            >
              {/* Text must remain to preserve button width even when invisible */}
              {token.text}
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
            O&apos;tkazib yuborish
          </button>
        </div>
      )}
    </div>
  );
}
