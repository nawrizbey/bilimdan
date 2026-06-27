import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';

const LISTEN_COLOR = '#10B981';
const LISTEN_DARK = '#059669';

export function ListenScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listenQuestions = useAppStore((s) => s.listenQuestions);
  const loadListen = useAppStore((s) => s.loadListen);
  const listenIdx = useAppStore((s) => s.listenIdx);
  const listenSel = useAppStore((s) => s.listenSel);
  const listenScore = useAppStore((s) => s.listenScore);
  const pickListen = useAppStore((s) => s.pickListen);
  const retryListen = useAppStore((s) => s.retryListen);

  useEffect(() => {
    loadListen();
  }, [loadListen]);

  if (listenQuestions.length === 0) {
    return <ContentLoader />;
  }

  const ended = listenIdx >= listenQuestions.length;

  if (ended) {
    const total = listenQuestions.length;
    const resultEmoji = listenScore >= total - 1 ? '🌟' : listenScore >= 1 ? '👍' : '💪';
    const xp = listenScore * 15;
    return (
      <div className="animate-pop max-w-[680px] mx-auto">
        <div
          className="animate-pop bg-white border border-border-2 rounded-[24px] p-10 text-center"
          style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
        >
          <div className="text-[64px]">{resultEmoji}</div>
          <h2 className="font-display font-extrabold text-[30px] my-2 mb-1 text-text">{t('listen.finished')}</h2>
          <p className="text-[15px] font-bold text-text-softer mb-4">
            <Trans
              i18nKey="listen.scoreLine"
              values={{ score: listenScore, total }}
              components={{ b: <b style={{ color: LISTEN_COLOR }} /> }}
            />
          </p>
          <div
            className="inline-flex items-center gap-2 rounded-[14px] py-[10px] px-[18px] mb-6"
            style={{ background: '#ECFDF5', border: '1px solid #6EE7B7' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={LISTEN_COLOR}>
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
            <span className="font-extrabold" style={{ color: '#065F46' }}>
              {t('listen.xpEarned', { xp })}
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryListen}
              className="border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer text-white"
              style={{ background: LISTEN_COLOR, boxShadow: `0 5px 0 ${LISTEN_DARK}` }}
            >
              {t('listen.retry')}
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="bg-border-3 text-[#475569] border-none rounded-[15px] py-[14px] px-[26px] font-display font-bold text-[16px] cursor-pointer"
            >
              {t('common.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = listenQuestions[Math.min(listenIdx, listenQuestions.length - 1)];
  const progressPct = ((Math.min(listenIdx + 1, listenQuestions.length)) / listenQuestions.length) * 100;

  return (
    <div className="animate-pop max-w-[680px] mx-auto">
      <div>
        <div className="flex items-center justify-between mb-[10px]">
          <h2 className="font-display font-extrabold text-[23px] m-0 text-text">{t('listen.title')}</h2>
          <span
            className="text-[13.5px] font-extrabold py-[6px] px-[13px] rounded-[20px]"
            style={{ color: LISTEN_COLOR, background: '#ECFDF5' }}
          >
            {Math.min(listenIdx + 1, listenQuestions.length)} / {listenQuestions.length}
          </span>
        </div>

        <div className="h-[9px] bg-border rounded-[20px] overflow-hidden mb-[22px]">
          <div
            className="h-full rounded-[20px] transition-[width] duration-300"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg,${LISTEN_COLOR},${LISTEN_DARK})` }}
          />
        </div>

        {/* Audio card showing the sentence */}
        <div
          className="bg-white border border-border-2 rounded-[24px] p-[30px] mb-[18px]"
          style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
        >
          <p className="text-center text-[13px] font-bold uppercase tracking-widest mb-3" style={{ color: LISTEN_COLOR }}>
            {t('listen.subtitle')}
          </p>
          <div
            className="flex items-start gap-4 rounded-[18px] p-5"
            style={{ background: '#ECFDF5', border: `2px solid ${LISTEN_COLOR}` }}
          >
            <span className="text-[36px] leading-none mt-1 flex-none">🎧</span>
            <p className="font-display font-extrabold text-[22px] text-text leading-snug m-0">
              {question.sentence}
            </p>
          </div>
        </div>

        {/* Answer options */}
        <div
          className="bg-white border border-border-2 rounded-[24px] p-[24px]"
          style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
        >
          <div className="flex flex-col gap-[11px]">
            {question.options.map((label, i) => {
              let bg = '#F8FAFC';
              let bd = '#E8EDF3';
              let col = '#0F172A';
              let bbg = '#E2E8F0';
              let bcol = '#64748B';
              if (listenSel != null) {
                if (i === question.correctIndex) {
                  bg = '#DCFCE7';
                  bd = '#22C55E';
                  col = '#15803D';
                  bbg = '#22C55E';
                  bcol = '#fff';
                } else if (i === listenSel) {
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
                  onClick={() => pickListen(i)}
                  className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
                  style={{ background: bg, borderColor: bd, color: col, cursor: listenSel != null ? 'default' : 'pointer' }}
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
        </div>
      </div>
    </div>
  );
}
