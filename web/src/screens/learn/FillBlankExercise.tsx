import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speech';
import { ExerciseCard, FeedbackLine, OptionsList, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

const REVEAL_DELAY_MS = 1300;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function blankSentence(example: string, en: string): { sentence: string; ok: boolean } {
  if (!example?.trim()) return { sentence: '', ok: false };
  const pattern = new RegExp(`\\b${escapeRegex(en)}\\b`, 'i');
  if (!pattern.test(example)) return { sentence: example, ok: false };
  return { sentence: example.replace(new RegExp(`\\b${escapeRegex(en)}\\b`, 'gi'), '___'), ok: true };
}

function SentenceDisplay({ sentence, revealed, en }: { sentence: string; revealed: boolean; en: string }) {
  const parts = sentence.split('___');
  return (
    <p className="font-bold text-[16px] text-text leading-relaxed m-0">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 &&
            (revealed ? (
              <span className="font-display font-extrabold text-[19px] text-[#15803D] px-1">{en}</span>
            ) : (
              <span className="font-display font-extrabold text-[19px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-[6px] mx-1 inline-block leading-snug">
                ___
              </span>
            ))}
        </span>
      ))}
    </p>
  );
}

/** Fill-in-the-blank inside the word's own example sentence. */
export function FillBlankExercise({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const [selected, setSelected] = useState<number | null>(null);
  const { word, options = [], correctIndex = 0 } = item;

  const { sentence: blanked, ok } = blankSentence(word.example ?? '', word.en);
  const displaySentence = ok ? blanked : `${(word.example ?? '').trim()} ___`.trim();

  const handlePick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    speak(word.example);
    setTimeout(() => onAnswer(i === correctIndex, getElapsed()), REVEAL_DELAY_MS);
  };

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={t('learn.promptFillBlank')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <div className="text-[40px] mb-1 leading-none">{word.emoji}</div>
        <div className="text-[13px] font-bold text-text-soft mb-4">{word.kaa}</div>

        <div className="bg-[#F8FAFC] border border-border-2 rounded-[20px] p-5 mb-5 text-left">
          <SentenceDisplay sentence={displaySentence} revealed={selected !== null} en={word.en} />
        </div>

        <OptionsList options={options} correctIndex={correctIndex} selected={selected} onPick={handlePick} />

        {selected !== null && (selected === correctIndex ? <FeedbackLine correct /> : <FeedbackLine correct={false} correctAnswer={options[correctIndex]} />)}
      </ExerciseCard>
    </div>
  );
}
