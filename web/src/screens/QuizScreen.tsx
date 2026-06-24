import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';

export function QuizScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const quizQuestions = useAppStore((s) => s.quizQuestions);
  const loadQuiz = useAppStore((s) => s.loadQuiz);
  const qq = useAppStore((s) => s.qq);
  const qSel = useAppStore((s) => s.qSel);
  const qScore = useAppStore((s) => s.qScore);
  const pickQuiz = useAppStore((s) => s.pickQuiz);
  const retryQuiz = useAppStore((s) => s.retryQuiz);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  if (quizQuestions.length === 0) {
    return <ContentLoader />;
  }

  const playing = qq < quizQuestions.length;
  const ended = qq >= quizQuestions.length;

  if (ended) {
    const resultEmoji = qScore >= quizQuestions.length - 1 ? '🌟' : qScore >= 1 ? '👍' : '💪';
    const xp = qScore * 15;
    return (
      <div className="animate-pop max-w-[680px] mx-auto">
        <div
          className="animate-pop bg-white border border-border-2 rounded-[24px] p-10 text-center"
          style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
        >
          <div className="text-[64px]">{resultEmoji}</div>
          <h2 className="font-display font-extrabold text-[30px] my-2 mb-1 text-text">{t('quiz.finished')}</h2>
          <p className="text-[15px] font-bold text-text-softer mb-4">
            <Trans i18nKey="quiz.scoreLine" values={{ score: qScore, total: quizQuestions.length }} components={{ b: <b className="text-quiz" /> }} />
          </p>
          <div className="inline-flex items-center gap-2 bg-[#FEFCE8] border border-[#FEF08A] rounded-[14px] py-[10px] px-[18px] mb-6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308">
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
            <span className="font-extrabold text-[#A16207]">{t('quiz.xpEarned', { xp })}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryQuiz}
              className="bg-quiz text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer"
              style={{ boxShadow: '0 5px 0 #B45309' }}
            >
              {t('quiz.retry')}
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

  const question = quizQuestions[Math.min(qq, quizQuestions.length - 1)];
  const progressPct = ((Math.min(qq + 1, quizQuestions.length)) / quizQuestions.length) * 100;

  return (
    <div className="animate-pop max-w-[680px] mx-auto">
      {playing && (
        <div>
          <div className="flex items-center justify-between mb-[10px]">
            <h2 className="font-display font-extrabold text-[23px] m-0 text-text">{t('dashboard.dailyQuiz')}</h2>
            <span className="text-[13.5px] font-extrabold text-quiz bg-[#FEF3C7] py-[6px] px-[13px] rounded-[20px]">
              {Math.min(qq + 1, quizQuestions.length)} / {quizQuestions.length}
            </span>
          </div>
          <div className="h-[9px] bg-border rounded-[20px] overflow-hidden mb-[22px]">
            <div
              className="h-full rounded-[20px] transition-[width] duration-300"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#F59E0B,#EA580C)' }}
            />
          </div>
          <div className="bg-white border border-border-2 rounded-[24px] p-[30px]" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
            <h3 className="font-display font-extrabold text-[24px] text-text mb-[22px] text-center">{question.question}</h3>
            <div className="flex flex-col gap-[11px]">
              {question.options.map((label, i) => {
                let bg = '#F8FAFC';
                let bd = '#E8EDF3';
                let col = '#0F172A';
                let bbg = '#E2E8F0';
                let bcol = '#64748B';
                if (qSel != null) {
                  if (i === question.correctIndex) {
                    bg = '#DCFCE7';
                    bd = '#22C55E';
                    col = '#15803D';
                    bbg = '#22C55E';
                    bcol = '#fff';
                  } else if (i === qSel) {
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
                    onClick={() => pickQuiz(i)}
                    className="flex items-center w-full text-left p-[14px] rounded-[15px] border-2 font-sans font-bold text-[16px] transition-all"
                    style={{ background: bg, borderColor: bd, color: col, cursor: qSel != null ? 'default' : 'pointer' }}
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
      )}
    </div>
  );
}
