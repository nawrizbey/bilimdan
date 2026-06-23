import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { computeLevel } from '../lib/level';

export function ProfileScreen() {
  const studentName = useAppStore((s) => s.studentName);
  const region = useAppStore((s) => s.region);
  const district = useAppStore((s) => s.district);
  const school = useAppStore((s) => s.school);
  const grade = useAppStore((s) => s.grade);
  const xp = useAppStore((s) => s.xp);
  const streak = useAppStore((s) => s.streak);
  const wordsKnownCount = useAppStore((s) => s.wordsKnownCount);
  const battleWins = useAppStore((s) => s.battleWins);
  const badges = useAppStore((s) => s.badges);
  const loadBadges = useAppStore((s) => s.loadBadges);
  const initial = studentName.charAt(0).toUpperCase();

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const { level, xpInLevel, xpForNextLevel } = computeLevel(xp);
  const levelPct = Math.round((xpInLevel / xpForNextLevel) * 100);

  const pstats = [
    { value: wordsKnownCount, label: "O'rganilgan so'z", color: '#22C55E' },
    { value: streak, label: 'Kun ketma-ket', color: '#F59E0B' },
    { value: battleWins, label: "G'alabalar", color: '#EC4899' },
    { value: level, label: 'Daraja', color: '#3B82F6' },
  ];

  return (
    <div className="animate-pop max-w-[880px] mx-auto">
      <div
        className="rounded-[24px] p-6 sm:p-[30px] flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4 sm:gap-[22px] relative overflow-hidden"
        style={{ background: 'linear-gradient(125deg,#3B82F6,#2563EB)', boxShadow: '0 14px 36px rgba(59,130,246,.3)' }}
      >
        <div className="absolute -right-[30px] -top-10 w-[180px] h-[180px] rounded-full bg-white/[.08]" />
        <div className="w-[90px] h-[90px] rounded-[26px] bg-white flex items-center justify-center font-display font-extrabold text-[40px] text-secondary-dark flex-none relative z-10">
          {initial}
        </div>
        <div className="flex-1 relative z-10 w-full">
          <h2 className="font-display font-extrabold text-[28px] text-white m-0">{studentName}</h2>
          <div className="text-white/90 font-bold text-[14px] my-[2px] mb-2">{grade}-sinf · Daraja {level}</div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-[7px] mb-3">
            <span className="inline-flex items-center gap-[5px] bg-white/[.18] text-white font-bold text-[12px] py-1 px-[11px] rounded-[20px]">
              📍 {region || 'Toshkent shahri'}
            </span>
            <span className="inline-flex items-center gap-[5px] bg-white/[.18] text-white font-bold text-[12px] py-1 px-[11px] rounded-[20px]">
              🏫 {district || 'Chilonzor tumani'}, {school || '24-son maktab'}
            </span>
          </div>
          <div className="h-[10px] bg-white/25 rounded-[20px] overflow-hidden max-w-[340px] mx-auto sm:mx-0">
            <div className="h-full rounded-[20px] bg-[#FACC15]" style={{ width: `${levelPct}%` }} />
          </div>
          <div className="text-white/85 font-bold text-[12px] mt-[6px]">
            {xpInLevel} / {xpForNextLevel} XP · {level + 1}-darajagacha {xpForNextLevel - xpInLevel} XP
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[14px] my-[18px]">
        {pstats.map((st) => (
          <div key={st.label} className="bg-white border border-border-2 rounded-[18px] p-[18px] text-center" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
            <div className="font-display font-extrabold text-[26px]" style={{ color: st.color }}>
              {st.value}
            </div>
            <div className="text-[12.5px] font-bold text-text-softer">{st.label}</div>
          </div>
        ))}
      </div>

      <h3 className="font-display font-extrabold text-[19px] mb-[14px] text-text">Yutuqlar va nishonlar</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[14px]">
        {(badges ?? []).map((b) => (
          <div
            key={b.key}
            className="rounded-[18px] p-[18px] text-center border"
            style={{
              background: '#fff',
              borderColor: b.earned ? '#EAF0F6' : '#EEF2F7',
              boxShadow: '0 2px 10px rgba(15,23,42,.04)',
              opacity: b.earned ? 1 : 0.55,
            }}
          >
            <div
              className="w-[54px] h-[54px] mx-auto rounded-[16px] flex items-center justify-center text-[28px]"
              style={{
                background: b.earned ? 'linear-gradient(150deg,#FEF3C7,#FDE68A)' : '#F1F5F9',
                filter: b.earned ? 'none' : 'grayscale(1)',
              }}
            >
              {b.emoji}
            </div>
            <div className="font-extrabold text-[13px] mt-2" style={{ color: b.earned ? '#0F172A' : '#94A3B8' }}>
              {b.title}
            </div>
            <div className="text-[11.5px] font-bold text-text-softer">{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
