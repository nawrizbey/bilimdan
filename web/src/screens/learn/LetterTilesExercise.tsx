import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseCard, FeedbackLine, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

interface Tile {
  id: number;
  char: string;
}

const DISTRACTOR_POOL = 'aeioubcdfghjklmnpqrstvwxyz'.split('');

function buildTiles(en: string): Tile[] {
  const letters = en.toLowerCase().split('');
  const needed = letters.length <= 4 ? 3 : 0;
  const distractors: string[] = [];
  while (distractors.length < needed) {
    const c = DISTRACTOR_POOL[Math.floor(Math.random() * DISTRACTOR_POOL.length)];
    if (!letters.includes(c) && !distractors.includes(c)) distractors.push(c);
  }
  const all = [...letters, ...distractors].map((char, i) => ({ id: i, char }));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

/** Assemble the English word from shuffled letter tiles (plus a few decoy
 * letters for very short words). Tap a tile to place it, tap a filled slot to
 * undo. "Tekseriw" only enables once every slot is filled. */
export function LetterTilesExercise({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const { word } = item;
  const target = word.en.toLowerCase();

  const [pool, setPool] = useState<Tile[]>(() => buildTiles(word.en));
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);
  const [submitting, setSubmitting] = useState(false);

  const place = (tile: Tile) => {
    if (result || placed.length >= target.length) return;
    setPool((p) => p.filter((x) => x.id !== tile.id));
    setPlaced((p) => [...p, tile]);
  };
  const undoLast = () => {
    if (result || placed.length === 0) return;
    const last = placed[placed.length - 1];
    setPlaced((p) => p.slice(0, -1));
    setPool((p) => [...p, last]);
  };

  const handleCheck = async () => {
    if (result !== null || submitting) return;
    setSubmitting(true);
    const answer = placed.map((tl) => tl.char).join('');
    const res = await onAnswer({ answerText: answer }, getElapsed(), 1100);
    setResult(res.correct ? 'correct' : 'wrong');
  };

  const full = placed.length === target.length;

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={t('learn.promptTiles')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <div className="text-[48px] mb-1 leading-none">{word.emoji}</div>
        <div className="font-display font-extrabold text-[24px] text-text mb-6">{word.kaa}</div>

        <div className="flex flex-wrap justify-center gap-2 mb-6 min-h-[52px]">
          {Array.from({ length: target.length }, (_, i) => {
            const tile = placed[i];
            return (
              <button
                key={i}
                onClick={tile ? undoLast : undefined}
                disabled={!tile || result !== null || submitting}
                className="w-[42px] h-[48px] rounded-[10px] border-2 flex items-center justify-center font-display font-extrabold text-[20px] uppercase"
                style={{
                  borderColor: result === 'correct' ? '#22C55E' : result === 'wrong' ? '#EF4444' : tile ? '#CBD5E1' : '#E2E8F0',
                  background: result === 'correct' ? '#DCFCE7' : result === 'wrong' ? '#FEE2E2' : tile ? '#F8FAFC' : 'transparent',
                  borderStyle: tile ? 'solid' : 'dashed',
                  color: '#0F172A',
                }}
              >
                {tile?.char ?? ''}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {pool.map((tile) => (
            <button
              key={tile.id}
              onClick={() => place(tile)}
              disabled={result !== null || submitting}
              className="w-[42px] h-[48px] rounded-[10px] border-2 border-border-2 bg-white flex items-center justify-center font-display font-extrabold text-[20px] uppercase cursor-pointer"
            >
              {tile.char}
            </button>
          ))}
        </div>

        {result === null ? (
          <button
            onClick={handleCheck}
            disabled={!full || submitting}
            className="w-full mt-6 bg-primary text-white font-display font-extrabold text-[16px] border-none rounded-[16px] py-[14px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: full ? '0 6px 0 #16A34A' : 'none' }}
          >
            {t('learn.check')}
          </button>
        ) : result === 'correct' ? (
          <FeedbackLine correct />
        ) : (
          <FeedbackLine correct={false} correctAnswer={word.en} />
        )}
      </ExerciseCard>
    </div>
  );
}
