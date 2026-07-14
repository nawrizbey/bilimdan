import { useEffect } from 'react';
import { speak } from '../../lib/speech';
import { TypingExerciseBody, type ExerciseProps } from './shared';

export function DictationExercise({ item, onAnswer }: ExerciseProps) {
  useEffect(() => {
    speak(item.word.en);
  }, [item.word.en]);

  return <TypingExerciseBody item={item} onAnswer={onAnswer} showKaaPrompt={false} onReplay={() => speak(item.word.en)} />;
}
