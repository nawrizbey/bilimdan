import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speech';
import { ExerciseCard, FeedbackLine, OptionsList, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

const REVEAL_DELAY_MS = 1100;

/** Pure listening comprehension: no text or emoji hint of the target word,
 * only its audio. */
export function ListenPickExercise({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const [selected, setSelected] = useState<number | null>(null);
  const { word, options = [], correctIndex = 0 } = item;

  useEffect(() => {
    speak(word.en);
    // Mount-once: remounted per queue item via the session screen's `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => onAnswer(i === correctIndex, getElapsed()), REVEAL_DELAY_MS);
  };

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={t('learn.promptListenPick')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <button
          onClick={() => speak(word.en)}
          className="w-20 h-20 mx-auto mb-5 rounded-full bg-listen text-white text-[34px] border-none cursor-pointer flex items-center justify-center animate-pulse"
          style={{ boxShadow: '0 6px 0 #0891B2' }}
          aria-label={t('learn.listenSample')}
        >
          🔊
        </button>

        <OptionsList options={options} correctIndex={correctIndex} selected={selected} onPick={handlePick} />

        {selected !== null && (selected === correctIndex ? <FeedbackLine correct /> : <FeedbackLine correct={false} correctAnswer={options[correctIndex]} />)}
      </ExerciseCard>
    </div>
  );
}
