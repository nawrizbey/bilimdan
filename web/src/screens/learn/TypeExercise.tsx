import { speak } from '../../lib/speech';
import { TypingExerciseBody, type ExerciseProps } from './shared';

export function TypeExercise({ item, onAnswer }: ExerciseProps) {
  return <TypingExerciseBody item={item} onAnswer={onAnswer} showKaaPrompt onReplay={() => speak(item.word.en)} />;
}
