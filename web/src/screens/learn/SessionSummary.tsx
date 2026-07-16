import { useTranslation } from 'react-i18next';
import { Confetti } from '../../components/Confetti';
import type { LearnSummaryResponse } from '../../types/api';

interface Props {
  summary: LearnSummaryResponse;
  type: 'lesson' | 'review' | 'hard';
  onContinue: () => void;
  onBackToPath: () => void;
  /** true when there's a next not-yet-complete lesson right after this one. */
  hasNext: boolean;
}

export function SessionSummary({ summary, type, onContinue, onBackToPath, hasNext }: Props) {
  const { t } = useTranslation();
  const title =
    type === 'review' ? t('learn.summaryReviewTitle') : type === 'hard' ? t('learn.summaryHardTitle') : t('learn.summaryTitle');

  return (
    <div className="max-w-[440px] mx-auto text-center animate-pop">
      <Confetti active />
      <div className="text-[64px] mb-2 leading-none">🎉</div>
      <h2 className="font-display font-extrabold text-[24px] text-text mb-6">{title}</h2>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-border-2 rounded-[18px] py-4 px-2 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="font-display font-extrabold text-[24px] text-primary">
            {summary.correctCount}/{summary.itemsTotal}
          </div>
          <div className="text-[11px] font-bold text-text-softer mt-1">{t('learn.summaryCorrect')}</div>
        </div>
        <div className="bg-white border border-border-2 rounded-[18px] py-4 px-2 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="font-display font-extrabold text-[24px] text-secondary">{summary.newWordsLearned}</div>
          <div className="text-[11px] font-bold text-text-softer mt-1">{t('learn.summaryNewWords')}</div>
        </div>
        <div className="bg-white border border-border-2 rounded-[18px] py-4 px-2 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="font-display font-extrabold text-[24px] text-xp">+{summary.xpGained}</div>
          <div className="text-[11px] font-bold text-text-softer mt-1">{t('learn.summaryXp')}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {hasNext && (
          <button
            onClick={onContinue}
            className="w-full bg-primary text-white font-display font-extrabold text-[16px] border-none rounded-[16px] py-[14px] cursor-pointer"
            style={{ boxShadow: '0 6px 0 #16A34A' }}
          >
            {t('learn.summaryContinue')}
          </button>
        )}
        <button
          onClick={onBackToPath}
          className="w-full bg-border-3 text-[#475569] font-display font-bold text-[15px] border-none rounded-[16px] py-[13px] cursor-pointer"
        >
          {t('learn.summaryBackToPath')}
        </button>
      </div>
    </div>
  );
}
