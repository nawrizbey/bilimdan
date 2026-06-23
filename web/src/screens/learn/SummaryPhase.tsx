import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function SummaryPhase() {
  const navigate = useNavigate();
  const currentUnitTitle = useAppStore((s) => s.currentUnitTitle);
  const currentUnitWords = useAppStore((s) => s.currentUnitWords);
  const writeCorrectCount = useAppStore((s) => s.writeCorrectCount);
  const writeMissedWords = useAppStore((s) => s.writeMissedWords);
  const testCorrectCount = useAppStore((s) => s.testCorrectCount);
  const testQuestions = useAppStore((s) => s.testQuestions);
  const sessionXpGained = useAppStore((s) => s.sessionXpGained);
  const allUnitsCompleted = useAppStore((s) => s.allUnitsCompleted);
  const advanceToNextUnit = useAppStore((s) => s.advanceToNextUnit);
  const [loadingNext, setLoadingNext] = useState(false);

  const handleNext = async () => {
    setLoadingNext(true);
    try {
      await advanceToNextUnit();
    } finally {
      setLoadingNext(false);
    }
  };

  if (allUnitsCompleted) {
    return (
      <div className="animate-pop max-w-[560px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <div className="text-[64px] mb-2">🏆</div>
        <h2 className="font-display font-extrabold text-[26px] text-text mb-1">Barcha mavzular tugallandi!</h2>
        <p className="text-[14px] font-bold text-text-softer mb-6">
          Siz hozircha mavjud bo'lgan barcha mavzulardagi so'zlarni o'rgandingiz. Tabriklaymiz! 🎉
        </p>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="bg-primary text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer"
          style={{ boxShadow: '0 5px 0 #15803D' }}
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const total = currentUnitWords.length;

  return (
    <div className="animate-pop max-w-[560px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
      <div className="text-[64px] mb-2">🎉</div>
      <h2 className="font-display font-extrabold text-[26px] text-text mb-1">Mavzu yakunlandi!</h2>
      <p className="text-[14px] font-bold text-text-softer mb-6">{currentUnitTitle}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-[16px] p-4 bg-[#EFF6FF] border border-[#BFDBFE]">
          <div className="font-display font-extrabold text-[22px] text-secondary-dark">{writeCorrectCount}/{total}</div>
          <div className="text-[11.5px] font-bold text-text-softer mt-1">✍️ Yozish</div>
        </div>
        <div className="rounded-[16px] p-4 bg-[#F3E8FF] border border-[#E9D5FF]">
          <div className="font-display font-extrabold text-[22px] text-speak-dark">{total}</div>
          <div className="text-[11.5px] font-bold text-text-softer mt-1">🎙️ Aytildi</div>
        </div>
        <div className="rounded-[16px] p-4 bg-[#FEF3C7] border border-[#FDE68A]">
          <div className="font-display font-extrabold text-[22px] text-quiz">{testCorrectCount}/{testQuestions.length}</div>
          <div className="text-[11.5px] font-bold text-text-softer mt-1">✅ Test</div>
        </div>
      </div>

      {writeMissedWords.length > 0 && (
        <div className="text-left bg-[#FEF2F2] border border-[#FECACA] rounded-[16px] p-4 mb-5">
          <div className="text-[12.5px] font-extrabold text-danger-dark mb-2">↻ Qayta ko'rib chiqish tavsiya etiladi</div>
          <div className="flex flex-wrap gap-[7px]">
            {writeMissedWords.map((w) => (
              <span key={w} className="bg-white border border-[#FECACA] text-danger-dark font-bold text-[13px] py-1 px-[11px] rounded-[20px]">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="inline-flex items-center gap-2 bg-[#FEFCE8] border border-[#FEF08A] rounded-[14px] py-[10px] px-[18px] mb-6">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308">
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
        </svg>
        <span className="font-extrabold text-[#A16207]">+{sessionXpGained} XP</span>
      </div>

      <div>
        <button
          onClick={handleNext}
          disabled={loadingNext}
          className="bg-primary text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer disabled:opacity-60"
          style={{ boxShadow: '0 5px 0 #15803D' }}
        >
          {loadingNext ? 'Yuklanmoqda…' : 'Keyingi mavzuga o\'tish →'}
        </button>
      </div>
    </div>
  );
}
