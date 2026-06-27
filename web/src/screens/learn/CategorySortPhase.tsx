import { useState } from 'react';

interface Word {
  id: number;
  en: string;
  uz: string;
  emoji: string;
  ipa: string;
}

interface Props {
  words: Word[];
  onComplete: (correct: number, total: number) => void;
  onSkip: () => void;
}

type ButtonFlash =
  | 'none'
  | 'vowel-correct'
  | 'vowel-wrong'
  | 'consonant-correct'
  | 'consonant-wrong';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function isVowelStart(word: Word): boolean {
  return VOWELS.has(word.en[0]?.toLowerCase() ?? '');
}

export function CategorySortPhase({ words, onComplete, onSkip }: Props) {
  const total = words.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [buttonFlash, setButtonFlash] = useState<ButtonFlash>('none');
  // isFading drives a CSS opacity transition on the word display area
  const [isFading, setIsFading] = useState(false);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });

  const currentWord = words[currentIdx];

  function handleChoice(isVowelChoice: boolean) {
    if (isAnimating || done || !currentWord) return;
    setIsAnimating(true);

    const isCorrect = isVowelChoice === isVowelStart(currentWord);
    // Compute new total before any async callbacks
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) setCorrectCount(newCorrect);

    setButtonFlash(
      isVowelChoice
        ? isCorrect
          ? 'vowel-correct'
          : 'vowel-wrong'
        : isCorrect
          ? 'consonant-correct'
          : 'consonant-wrong',
    );

    // Phase 1 (400 ms): hold the feedback colour on the button
    setTimeout(() => {
      setButtonFlash('none');
      setIsFading(true); // opacity: 0 → CSS transition begins

      // Phase 2 (200 ms): word fades out; then swap content and fade back in
      setTimeout(() => {
        const nextIdx = currentIdx + 1;

        if (nextIdx >= total) {
          // All words done — show summary, then notify parent
          setFinalScore({ correct: newCorrect, total });
          setDone(true);
          setTimeout(() => onComplete(newCorrect, total), 1500);
        } else {
          setCurrentIdx(nextIdx);
          setIsFading(false); // opacity: 1 → CSS transition fades new word in
          setIsAnimating(false);
        }
      }, 200);
    }, 400);
  }

  // ── Button style helpers ──────────────────────────────────────────────────

  function vowelStyle() {
    if (buttonFlash === 'vowel-correct')
      return { background: '#DCFCE7', borderColor: '#22C55E', color: '#15803D' };
    if (buttonFlash === 'vowel-wrong')
      return { background: '#FEE2E2', borderColor: '#EF4444', color: '#DC2626' };
    return { background: '#EFF6FF', borderColor: '#3B82F6', color: '#1D4ED8' };
  }

  function consonantStyle() {
    if (buttonFlash === 'consonant-correct')
      return { background: '#DCFCE7', borderColor: '#22C55E', color: '#15803D' };
    if (buttonFlash === 'consonant-wrong')
      return { background: '#FEE2E2', borderColor: '#EF4444', color: '#DC2626' };
    return { background: '#FFF7ED', borderColor: '#F97316', color: '#9A3412' };
  }

  // ── Summary screen ────────────────────────────────────────────────────────

  if (done) {
    const pct = finalScore.total > 0 ? finalScore.correct / finalScore.total : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    const message =
      pct >= 0.9 ? 'Ájayıp!' : pct >= 0.6 ? 'Jaqsı!' : 'Dawam etiń!';

    return (
      <div className="max-w-[520px] mx-auto text-center select-none animate-pop">
        <div
          className="bg-white border border-border-2 rounded-[26px] p-10"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
        >
          <div className="text-[56px] leading-none mb-4">{'⭐'.repeat(stars)}</div>
          <div className="font-display font-extrabold text-[40px] text-[#F97316] mb-2">
            {finalScore.correct}/{finalScore.total}
          </div>
          <div className="font-display font-extrabold text-[26px] text-text">
            {message}
          </div>
        </div>
      </div>
    );
  }

  const vs = vowelStyle();
  const cs = consonantStyle();

  // ── Main game screen ──────────────────────────────────────────────────────

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[#FFF7ED] text-[#9A3412] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        🗂️ Saralama
      </div>

      {/* Progress text */}
      <div className="text-[13.5px] font-bold text-text-softer mb-3">
        {currentIdx + 1}/{total} saralandı
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-[8px] mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-[8px] h-[8px] rounded-full transition-all duration-300"
            style={{
              background:
                i < currentIdx
                  ? '#F97316'
                  : i === currentIdx
                    ? '#FED7AA'
                    : '#E8EDF3',
              transform: i === currentIdx ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="bg-white border border-border-2 rounded-[26px] p-6 pb-7 mb-4"
        style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
      >
        {/* Rule legend -------------------------------------------------- */}
        <div className="bg-[#FFF7ED] rounded-[12px] p-3 mb-5">
          <div className="text-[11px] font-extrabold text-[#9A3412] tracking-[.06em] uppercase mb-[5px]">
            Hárip túrine qarap saraław
          </div>
          <div className="flex justify-center gap-4 text-[11.5px] font-bold text-text-soft">
            <span>🔵 A E I O U — Dawıslı</span>
            <span>🔴 Barlıq basqalar — Dawıssız</span>
          </div>
        </div>

        {/* Word display — the same DOM element persists across words so the
            opacity CSS transition correctly fades out → in as isFading toggles */}
        <div style={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.2s ease' }}>
          <div className="text-[72px] leading-none mb-2">{currentWord?.emoji}</div>
          <div className="font-display font-extrabold text-[48px] text-text leading-tight mb-1">
            {currentWord?.en}
          </div>
          <div className="text-[13px] text-text-softer font-bold mb-5">
            {currentWord?.ipa}
          </div>
        </div>

        {/* Category buttons -------------------------------------------- */}
        <div className="flex gap-3">
          {/* Vowel button */}
          <button
            onClick={() => handleChoice(true)}
            disabled={isAnimating}
            className={`flex-1 min-h-[72px] border-2 rounded-[16px] flex flex-col items-center justify-center gap-[3px] transition-all duration-200${
              buttonFlash === 'vowel-wrong' ? ' animate-shake' : ''
            }`}
            style={vs}
          >
            <span className="text-[18px]">🔵</span>
            <span className="font-display font-bold text-[14px]">Dawıslı</span>
            <span className="text-[11px] font-bold opacity-70">(A, E, I, O, U)</span>
          </button>

          {/* Consonant button */}
          <button
            onClick={() => handleChoice(false)}
            disabled={isAnimating}
            className={`flex-1 min-h-[72px] border-2 rounded-[16px] flex flex-col items-center justify-center gap-[3px] transition-all duration-200${
              buttonFlash === 'consonant-wrong' ? ' animate-shake' : ''
            }`}
            style={cs}
          >
            <span className="text-[18px]">🔴</span>
            <span className="font-display font-bold text-[14px]">Dawıssız</span>
          </button>
        </div>
      </div>

      {/* Skip */}
      <div className="text-left">
        <button
          onClick={onSkip}
          className="bg-transparent border-none text-[13px] font-bold text-text-softer cursor-pointer hover:text-text-soft transition-colors"
        >
          O&apos;tkazib yuborish
        </button>
      </div>
    </div>
  );
}
