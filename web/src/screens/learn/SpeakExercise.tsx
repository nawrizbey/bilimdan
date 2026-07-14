import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useMicScoring } from '../../lib/useMicScoring';
import { speak } from '../../lib/speech';
import { ExerciseCard, FeedbackLine, PromptHeader, type ExerciseProps } from './shared';
import { useResponseTimer } from './useResponseTimer';

const PASS_SCORE = 60;
const ERROR_FALLBACK_STREAK = 3;

/** Speaking practice — no skip button (product requirement). The only way past
 * this exercise without a passing score is 3 consecutive mic/recognition
 * *failures* (permission denied, no speech detected, network...), which
 * auto-continues so a broken microphone can't brick the whole path. A low
 * pronunciation score never unlocks that fallback — only unlimited retry. */
export function SpeakExercise({ item, onAnswer }: ExerciseProps) {
  const { t } = useTranslation();
  const getElapsed = useResponseTimer(item.wordId + item.exercise);
  const micEnabled = useAppStore((s) => s.settings.mic);
  const { word } = item;

  const [errorStreak, setErrorStreak] = useState(0);
  const [outcome, setOutcome] = useState<{ score: number; transcript: string } | null>(null);
  const resolvedRef = useRef(false);

  const handleResult = (score: number, transcript: string) => {
    setErrorStreak(0);
    setOutcome({ score, transcript });
    if (score >= PASS_SCORE && !resolvedRef.current) {
      resolvedRef.current = true;
      setTimeout(() => onAnswer(true, getElapsed()), 1300);
    }
  };

  const { supported, recording, error, handleMicClick } = useMicScoring({
    word: word.en,
    micEnabled,
    onStart: () => setOutcome(null),
    onResult: handleResult,
    onError: () => setErrorStreak((n) => n + 1),
    resetKey: item.wordId + item.exercise,
  });

  useEffect(() => {
    speak(word.en);
    // Mount-once: remounted per queue item via the session screen's `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forceContinue = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onAnswer(true, getElapsed());
  };

  const passed = outcome != null && outcome.score >= PASS_SCORE;
  const showFallback = !supported || errorStreak >= ERROR_FALLBACK_STREAK;

  return (
    <div className="max-w-[520px] mx-auto text-center select-none">
      <PromptHeader label={t('learn.promptSpeak')} isRepeat={item.isRepeat} />
      <ExerciseCard>
        <div className="text-[48px] mb-1 leading-none">{word.emoji}</div>
        <div className="font-display font-extrabold text-[28px] text-text">{word.en}</div>
        <div className="text-[14px] font-bold text-text-softer mt-1 mb-4">{word.ipa}</div>

        <button
          onClick={() => speak(word.en)}
          className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1D4ED8] font-extrabold text-[13px] py-[9px] px-4 rounded-[14px] border-none cursor-pointer mb-6"
        >
          🔊 {t('learn.listenSample')}
        </button>

        {showFallback ? (
          <>
            <div className="text-[13px] font-bold text-text-softer mb-4">
              {supported ? t('learn.speakMicFallback') : t('learn.speakNotSupported')}
            </div>
            <button
              onClick={forceContinue}
              className="w-full bg-primary text-white font-display font-extrabold text-[16px] border-none rounded-[16px] py-[14px] cursor-pointer"
              style={{ boxShadow: '0 6px 0 #16A34A' }}
            >
              {t('learn.continue')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleMicClick}
              className="w-24 h-24 mx-auto mb-3 rounded-full text-white text-[40px] border-none cursor-pointer flex items-center justify-center"
              style={{
                background: recording ? '#EF4444' : '#8B5CF6',
                boxShadow: `0 6px 0 ${recording ? '#DC2626' : '#7C3AED'}`,
              }}
              aria-label={recording ? t('learn.micStop') : t('learn.micStart')}
            >
              {recording ? '⏹️' : '🎙️'}
            </button>
            <div className="text-[13px] font-bold text-text-softer mb-2">
              {recording ? t('learn.micListening') : t('learn.micStart')}
            </div>

            {error && <div className="text-[13px] font-bold text-danger mt-2">{error}</div>}

            {outcome && (
              <div className="mt-3">
                <div className="text-[13px] font-bold text-text-soft">{t('learn.youSaid', { transcript: outcome.transcript })}</div>
                {passed ? (
                  <FeedbackLine correct />
                ) : (
                  <div className="text-[14px] font-extrabold text-danger mt-2 animate-pop">{t('learn.speakTryAgain')}</div>
                )}
              </div>
            )}
          </>
        )}
      </ExerciseCard>
    </div>
  );
}
