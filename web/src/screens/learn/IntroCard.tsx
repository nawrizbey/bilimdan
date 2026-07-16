import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speech';
import { ExerciseCard, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

function highlightWord(example: string, en: string): React.ReactNode {
  if (!example?.trim()) return null;
  const pattern = new RegExp(`(\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'gi');
  const parts = example.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <span key={i} className="font-display font-extrabold text-[#15803D]">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** First-ever exposure to a word: presentation only, ungraded — always
 * resolves onAnswer(true, ...) when the student taps through. */
export function IntroCard({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId);
  const { word } = item;

  useEffect(() => {
    speak(word.en);
  }, [word.en]);

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={`${word.emoji} ${t('nav.learn')}`} />
      <ExerciseCard>
        <div className="text-[64px] mb-2 leading-none">{word.emoji}</div>
        <button
          onClick={() => speak(word.en)}
          className="font-display font-extrabold text-[30px] text-text bg-transparent border-none cursor-pointer inline-flex items-center gap-2"
        >
          {word.en} <span className="text-[20px]">🔊</span>
        </button>
        <div className="text-[14px] font-bold text-text-softer mt-1">{word.ipa}</div>
        <div className="text-[18px] font-extrabold text-secondary mt-3">{word.kaa}</div>

        <div className="bg-[#F8FAFC] border border-border-2 rounded-[20px] p-4 mt-5 text-left">
          <p className="font-bold text-[15px] text-text leading-relaxed m-0">{highlightWord(word.example, word.en)}</p>
        </div>

        <button
          onClick={() => onAnswer({ correct: true }, getElapsed(), 0)}
          className="w-full mt-6 bg-primary text-white font-display font-extrabold text-[16px] border-none rounded-[16px] py-[14px] cursor-pointer"
          style={{ boxShadow: '0 6px 0 #16A34A' }}
        >
          {t('learn.gotIt')}
        </button>
      </ExerciseCard>
    </div>
  );
}
