import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speech';
import { ExerciseCard, FeedbackLine, OptionsList, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

const REVEAL_DELAY_MS = 1100;

/** Handles both mcq_en2kaa (prompt in English, pick the Karakalpak translation)
 * and mcq_kaa2en (prompt in Karakalpak, pick the English word) — the server
 * already built the right options/correctIndex for whichever direction this
 * queue item is. */
export function McqExercise({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const { word, options = [] } = item;
  const isEn2Kaa = item.exercise === 'mcq_en2kaa';

  useEffect(() => {
    if (isEn2Kaa) speak(word.en);
    // Mount-once: the session screen remounts this component (via `key`) for
    // every new queue item, so this only ever needs to run on first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const res = await onAnswer({ answerIndex: i }, getElapsed(), REVEAL_DELAY_MS);
    setCorrectIndex(res.correctIndex ?? null);
    if (!isEn2Kaa && res.correctIndex != null) speak(options[res.correctIndex]);
  };

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={isEn2Kaa ? t('learn.promptMcqEn2Kaa') : t('learn.promptMcqKaa2En')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <div className="text-[48px] mb-1 leading-none">{word.emoji}</div>
        {isEn2Kaa ? (
          <button
            onClick={() => speak(word.en)}
            className="font-display font-extrabold text-[26px] text-text bg-transparent border-none cursor-pointer inline-flex items-center gap-2 mb-5"
          >
            {word.en} <span className="text-[18px]">🔊</span>
          </button>
        ) : (
          <div className="font-display font-extrabold text-[26px] text-text mb-5">{word.kaa}</div>
        )}

        <OptionsList options={options} correctIndex={correctIndex} selected={selected} onPick={handlePick} />

        {selected !== null &&
          correctIndex !== null &&
          (selected === correctIndex ? <FeedbackLine correct /> : <FeedbackLine correct={false} correctAnswer={options[correctIndex]} />)}
      </ExerciseCard>
    </div>
  );
}
