import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';

export function WritePhase() {
  const { t } = useTranslation();
  const writeIdx = useAppStore((s) => s.writeIdx);
  const writeInput = useAppStore((s) => s.writeInput);
  const writeResult = useAppStore((s) => s.writeResult);
  const writeCorrectCount = useAppStore((s) => s.writeCorrectCount);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const setWriteInput = useAppStore((s) => s.setWriteInput);
  const submitWrite = useAppStore((s) => s.submitWrite);
  const nextWrite = useAppStore((s) => s.nextWrite);

  const word = currentUnitWords[writeIdx];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [writeIdx]);

  if (!word) return null;

  const answered = writeResult != null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answered) {
      nextWrite();
    } else if (writeInput.trim()) {
      submitWrite();
    }
  };

  return (
    <div className="max-w-[520px] mx-auto text-center">
      <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-secondary-dark font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px] mb-[10px]">
        {t('write.badge')}
      </div>
      <div className="text-[13.5px] font-bold text-text-softer mb-5">
        {t('write.progress', { idx: writeIdx + 1, total: currentUnitWords.length, count: writeCorrectCount })}
      </div>

      <div className="bg-white border border-border-2 rounded-[26px] p-8" style={{ boxShadow: '0 10px 30px rgba(15,23,42,.06)' }}>
        <div className="text-[56px] mb-2">{word.emoji}</div>
        <div className="text-[13px] font-extrabold text-text-softer tracking-[.06em] mb-1">{t('write.translationLabel')}</div>
        <div className="font-display font-extrabold text-[36px] text-text mb-6">{word.uz}</div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={writeInput}
            onChange={(e) => setWriteInput(e.target.value)}
            disabled={answered}
            placeholder={t('write.placeholder') ?? undefined}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`w-full text-center py-[14px] px-[16px] border-2 rounded-[14px] font-display font-bold text-[22px] outline-none mb-4 disabled:bg-[#F8FAFC] ${
              writeResult === 'incorrect' ? 'animate-shake' : ''
            }`}
            style={{
              borderColor: writeResult === 'correct' ? '#22C55E' : writeResult === 'incorrect' ? '#EF4444' : '#E8EDF3',
              background: writeResult ? (writeResult === 'correct' ? '#F0FDF4' : '#FEF2F2') : '#F8FAFC',
              color: writeResult === 'correct' ? '#15803D' : writeResult === 'incorrect' ? '#DC2626' : '#0F172A',
            }}
          />

          {writeResult === 'correct' && (
            <div className="text-[15px] font-extrabold text-[#15803D] mb-4">{t('write.correct')}</div>
          )}
          {writeResult === 'incorrect' && (
            <div className="text-[15px] font-extrabold text-danger-dark mb-4">
              {t('write.incorrect', { word: word.en })}
            </div>
          )}

          <div className="flex gap-3">
            {!answered && (
              <button
                type="button"
                onClick={nextWrite}
                className="flex-1 bg-border-3 text-[#475569] border-none rounded-[15px] py-[14px] font-display font-bold text-[15px] cursor-pointer"
              >
                {t('write.skip')}
              </button>
            )}
            <button
              type="submit"
              disabled={!answered && !writeInput.trim()}
              className="flex-1 bg-secondary text-white border-none rounded-[15px] py-[14px] font-display font-extrabold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 5px 0 #2563EB' }}
            >
              {answered ? t('write.next') : t('write.check')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
