import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';

export function TestPhase() {
  const { t } = useTranslation();
  const testIdx = useAppStore((s) => s.testIdx);
  const testSel = useAppStore((s) => s.testSel);
  const testQuestions = useAppStore((s) => s.testQuestions);
  const testCorrectCount = useAppStore((s) => s.testCorrectCount);
  const sessionSaveError = useAppStore((s) => s.sessionSaveError);
  const pickTest = useAppStore((s) => s.pickTest);
  const nextTest = useAppStore((s) => s.nextTest);
  const completeLearnSession = useAppStore((s) => s.completeLearnSession);
  const [saving, setSaving] = useState(false);

  const finishOrRetry = async () => {
    setSaving(true);
    try {
      await completeLearnSession();
    } finally {
      setSaving(false);
    }
  };

  if (sessionSaveError) {
    return (
      <div className="max-w-[480px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-9" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <div className="text-[48px] mb-2">📡</div>
        <h3 className="font-display font-extrabold text-[20px] text-text mb-2">{t('test.saveFailedTitle')}</h3>
        <p className="text-[14px] font-bold text-text-softer mb-6">{sessionSaveError}</p>
        <button
          onClick={finishOrRetry}
          disabled={saving}
          className="bg-quiz text-white border-none rounded-[14px] py-[13px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer disabled:opacity-60"
          style={{ boxShadow: '0 5px 0 #B45309' }}
        >
          {saving ? t('test.saving') : t('common.retry')}
        </button>
      </div>
    );
  }

  const question = testQuestions[testIdx];
  if (!question) return null;

  const progressPct = ((testIdx + 1) / testQuestions.length) * 100;
  const isLastQuestion = testIdx + 1 >= testQuestions.length;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-quiz font-extrabold text-[12.5px] py-[6px] px-[14px] rounded-[20px]">
          {t('test.badge')}
        </div>
        <span className="text-[13.5px] font-extrabold text-quiz bg-[#FEF3C7] py-[6px] px-[13px] rounded-[20px]">
          {t('test.progress', { idx: testIdx + 1, total: testQuestions.length, count: testCorrectCount })}
        </span>
      </div>
      <div className="h-[9px] bg-border rounded-[20px] overflow-hidden mb-[22px]">
        <div
          className="h-full rounded-[20px] transition-[width] duration-300"
          style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#F59E0B,#EA580C)' }}
        />
      </div>

      <div className="bg-white border border-border-2 rounded-[24px] p-[30px]" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <h3 className="font-display font-extrabold text-[22px] text-text mb-[22px] text-center">
          {t('test.question', { word: question.word })}
        </h3>
        <div className="flex flex-col gap-[11px]">
          {question.options.map((label, i) => {
            let bg = '#F8FAFC';
            let bd = '#E8EDF3';
            let col = '#0F172A';
            let bbg = '#E2E8F0';
            let bcol = '#64748B';
            if (testSel != null) {
              if (i === question.correctIndex) {
                bg = '#DCFCE7';
                bd = '#22C55E';
                col = '#15803D';
                bbg = '#22C55E';
                bcol = '#fff';
              } else if (i === testSel) {
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
                onClick={() => pickTest(i)}
                className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
                style={{ background: bg, borderColor: bd, color: col, cursor: testSel != null ? 'default' : 'pointer' }}
              >
                <span
                  className="w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center font-extrabold text-[14px] mr-[13px]"
                  style={{ background: bbg, color: bcol }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {testSel != null && (
          <button
            onClick={() => (isLastQuestion ? finishOrRetry() : nextTest())}
            disabled={saving}
            className="w-full mt-5 bg-quiz text-white border-none rounded-[14px] py-[13px] font-display font-extrabold text-[16px] cursor-pointer disabled:opacity-60"
            style={{ boxShadow: '0 5px 0 #B45309' }}
          >
            {isLastQuestion ? (saving ? t('test.savingResults') : t('test.finish')) : t('test.nextQuestion')}
          </button>
        )}
      </div>
    </div>
  );
}
