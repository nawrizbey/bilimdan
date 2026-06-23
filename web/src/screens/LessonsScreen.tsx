import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';

export function LessonsScreen() {
  const navigate = useNavigate();
  const units = useAppStore((s) => s.units);
  const loadUnits = useAppStore((s) => s.loadUnits);
  const loadUnitWords = useAppStore((s) => s.loadUnitWords);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  if (!units) {
    return <ContentLoader />;
  }

  const handleOpen = (unitId: number) => {
    loadUnitWords(unitId);
    navigate('/app/learn');
  };

  return (
    <div className="animate-pop max-w-[1080px]">
      <h2 className="font-display font-extrabold text-[25px] mb-1 text-text">Mavzular 📚</h2>
      <p className="text-[14px] font-bold text-text-softer mb-[22px]">
        5–6 sinf darsligi asosida tuzilgan birliklar. Tartib bilan o'rganing.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {units.map((u) => {
          const noContent = u.wordsCount === 0;
          const done = u.pct === 100;
          const current = !noContent && !done;
          const tagText = noContent ? 'Tayyorlanmoqda' : done ? "✓ Tugadi" : 'Joriy';
          const accent = noContent ? '#CBD5E1' : done ? '#3B82F6' : '#22C55E';

          return (
            <div
              key={u.id}
              onClick={() => !noContent && handleOpen(u.id)}
              className="rounded-[22px] p-[22px] transition-transform"
              style={{
                background: '#fff',
                border: `1px solid ${current ? '#BBF7D0' : '#EAF0F6'}`,
                boxShadow: current ? '0 8px 22px rgba(34,197,94,.15)' : '0 2px 10px rgba(15,23,42,.04)',
                cursor: noContent ? 'not-allowed' : 'pointer',
                opacity: noContent ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-[14px]">
                <div
                  className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center text-[26px]"
                  style={{ background: noContent ? '#F1F5F9' : '#F0FDF4' }}
                >
                  {u.emoji}
                </div>
                <span
                  className="text-[11px] font-extrabold py-[5px] px-[11px] rounded-[20px] text-white"
                  style={{ background: accent }}
                >
                  {tagText}
                </span>
              </div>
              <div className="font-display font-extrabold text-[19px]" style={{ color: noContent ? '#94A3B8' : '#0F172A' }}>
                {u.title}
              </div>
              <div className="text-[13px] font-bold text-text-softer my-[2px] mb-[14px]">{u.wordsCount} ta so'z</div>
              <div className="h-2 bg-[#EEF2F7] rounded-[20px] overflow-hidden">
                <div
                  className="h-full rounded-[20px]"
                  style={{ width: `${u.pct}%`, background: `linear-gradient(90deg,${accent},${accent})` }}
                />
              </div>
              <div className="text-[12px] font-extrabold mt-[7px]" style={{ color: noContent ? '#CBD5E1' : accent }}>
                {noContent ? "So'zlar hali qo'shilmagan" : `${u.pct}% o'rganildi`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
