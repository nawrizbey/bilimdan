import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LearnAnswerPayload, LearnQueueItem } from '../../types/api';
import { useResponseTimer } from './useResponseTimer';

/** Every exercise component shares this contract: render the prompt for `item`,
 * then call `onAnswer` with the student's answer — the server grades it and
 * returns the verdict, which the component uses to show its own brief inline
 * feedback (mirrors how the Oyinlar game phases work) before the queue
 * advances `revealDelayMs` later. */
export interface ExerciseProps {
  item: LearnQueueItem & { isRepeat?: boolean };
  onAnswer: (
    payload: LearnAnswerPayload,
    responseMs: number,
    revealDelayMs: number,
  ) => Promise<{ correct: boolean; correctIndex?: number }>;
}

export function PromptHeader({ label, isRepeat }: { label: string; isRepeat?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-[10px]">
      <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1D4ED8] font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
        {label}
      </div>
      {isRepeat && (
        <span className="text-[11px] font-extrabold text-[#B45309] bg-[#FEF3C7] py-[4px] px-[10px] rounded-[20px]">
          {t('learn.repeatChip')}
        </span>
      )}
    </div>
  );
}

export function ExerciseCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white border border-border-2 rounded-[26px] p-6 pb-7"
      style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}
    >
      {children}
    </div>
  );
}

interface OptionsListProps {
  options: string[];
  /** Only known once the server has graded the pick — null while a pick is
   * in flight (buttons are already disabled via `selected`, so there's no
   * interaction to block, just nothing to color yet). */
  correctIndex: number | null;
  selected: number | null;
  onPick: (i: number) => void;
}

/** Shared A/B/C/D multiple-choice option list with correct/wrong reveal
 * coloring — same visual language as the Oyinlar game phases. */
export function OptionsList({ options, correctIndex, selected, onPick }: OptionsListProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      {options.map((opt, i) => {
        let bg = '#F8FAFC';
        let bd = '#E8EDF3';
        let col = '#0F172A';
        let bbg = '#E2E8F0';
        let bcol = '#64748B';

        if (selected !== null && correctIndex !== null) {
          if (i === correctIndex) {
            bg = '#DCFCE7';
            bd = '#22C55E';
            col = '#15803D';
            bbg = '#22C55E';
            bcol = '#fff';
          } else if (i === selected) {
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
            onClick={() => onPick(i)}
            disabled={selected !== null}
            className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
            style={{ background: bg, borderColor: bd, color: col, cursor: selected !== null ? 'default' : 'pointer' }}
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
  );
}

export function FeedbackLine({ correct, correctAnswer }: { correct: boolean; correctAnswer?: string }) {
  const { t } = useTranslation();
  if (correct) {
    return <div className="text-[15px] font-extrabold text-[#15803D] mt-4 animate-pop">{t('learn.correct')}</div>;
  }
  return (
    <div className="text-[14px] font-extrabold text-text-soft mt-4 animate-pop">
      {correctAnswer ? (
        t('learn.incorrectAnswer', { answer: correctAnswer })
      ) : (
        t('learn.incorrectAnswer', { answer: '' })
      )}
    </div>
  );
}

export function AudioReplayButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1D4ED8] font-extrabold text-[13px] py-[9px] px-4 rounded-[14px] border-none cursor-pointer"
    >
      🔊 {label}
    </button>
  );
}

/** Shared body for type_en (word.kaa shown as the prompt) and dictation (only
 * audio, no text) — both are "type the English word" with a case-insensitive
 * exact match and no typo tolerance. Graded server-side (see /api/learn/answer). */
export function TypingExerciseBody({
  item,
  onAnswer,
  showKaaPrompt,
  onReplay,
}: ExerciseProps & { showKaaPrompt: boolean; onReplay: () => void }) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);
  const [submitting, setSubmitting] = useState(false);
  const { word } = item;

  const submit = async () => {
    if (result !== null || submitting || value.trim() === '') return;
    setSubmitting(true);
    const res = await onAnswer({ answerText: value.trim() }, getElapsed(), 1100);
    setResult(res.correct ? 'correct' : 'wrong');
  };

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={showKaaPrompt ? t('learn.promptType') : t('learn.promptDictation')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <div className="text-[48px] mb-1 leading-none">{word.emoji}</div>
        {showKaaPrompt ? (
          <div className="font-display font-extrabold text-[24px] text-text mb-5">{word.kaa}</div>
        ) : (
          <button
            onClick={onReplay}
            className="w-20 h-20 mx-auto mb-5 rounded-full bg-secondary text-white text-[34px] border-none cursor-pointer flex items-center justify-center animate-pulse"
            style={{ boxShadow: '0 6px 0 #2563EB' }}
            aria-label={t('learn.listenSample')}
          >
            🔊
          </button>
        )}

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={result !== null || submitting}
          autoFocus
          placeholder={t('learn.typePlaceholder') ?? undefined}
          className="w-full text-center font-sans font-bold text-[18px] border-2 border-border-2 rounded-[14px] py-[13px] px-4 outline-none"
          style={{
            borderColor: result === 'correct' ? '#22C55E' : result === 'wrong' ? '#EF4444' : undefined,
            background: result === 'correct' ? '#F0FDF4' : result === 'wrong' ? '#FEF2F2' : '#fff',
          }}
        />

        {result === null ? (
          <button
            onClick={submit}
            disabled={value.trim() === '' || submitting}
            className="w-full mt-4 bg-primary text-white font-display font-extrabold text-[16px] border-none rounded-[16px] py-[14px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
