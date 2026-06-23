import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotIcon } from '../components/MascotIcon';
import { useAppStore } from '../store/useAppStore';

const WEEK_DAYS = [
  { label: 'D', state: 'done' },
  { label: 'S', state: 'done' },
  { label: 'C', state: 'done' },
  { label: 'P', state: 'done' },
  { label: 'J', state: 'done' },
  { label: 'S', state: 'today' },
  { label: 'Y', state: 'upcoming' },
] as const;

const dayStyle: Record<(typeof WEEK_DAYS)[number]['state'], string> = {
  done: 'bg-primary text-white',
  today: 'bg-[#FEF3C7] text-[#B45309] border-2 border-dashed border-[#F59E0B]',
  upcoming: 'bg-border-3 text-[#CBD5E1]',
};

const rankBadgeStyle = (i: number) => {
  if (i === 0) return { background: '#FACC15', color: '#0F172A' };
  if (i === 1) return { background: '#CBD5E1', color: '#0F172A' };
  if (i === 2) return { background: '#F59E0B', color: '#fff' };
  return { background: 'rgba(255,255,255,.1)', color: '#94A3B8' };
};

export function DashboardScreen() {
  const navigate = useNavigate();
  const studentName = useAppStore((s) => s.studentName);
  const streak = useAppStore((s) => s.streak);
  const goalMin = useAppStore((s) => s.goalMin);
  const goalDone = useAppStore((s) => s.goalDone);
  const wordsKnownCount = useAppStore((s) => s.wordsKnownCount);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const loadLeaderboard = useAppStore((s) => s.loadLeaderboard);
  const goalPct = Math.min(100, Math.round((goalDone / goalMin) * 100));
  const remaining = Math.max(0, goalMin - goalDone);

  useEffect(() => {
    loadLeaderboard('school');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringCircumference = 251;
  const ringOffset = ringCircumference - (ringCircumference * goalPct) / 100;

  return (
    <div className="animate-pop max-w-[1180px]">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-[26px] p-6 sm:p-[32px_36px] flex flex-col sm:flex-row items-center gap-6"
        style={{
          background: 'linear-gradient(125deg,#22C55E 0%,#16A34A 60%,#15803D 100%)',
          boxShadow: '0 18px 40px rgba(22,163,74,.32)',
        }}
      >
        <div className="absolute -right-10 -top-[50px] w-[230px] h-[230px] rounded-full bg-white/[.08]" />
        <div className="absolute right-[120px] -bottom-[70px] w-[170px] h-[170px] rounded-full bg-white/[.07]" />
        <div className="flex-1 relative z-10 text-center sm:text-left">
          <div className="inline-block bg-white/20 text-white font-extrabold text-[12px] py-[5px] px-3 rounded-[20px] mb-3">
            👋 Xush kelibsiz
          </div>
          <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] text-white mb-[6px]">Salom, {studentName}!</h1>
          <p className="text-white/90 text-[15px] font-semibold mb-5 max-w-[440px]">
            Bugun yana <b>{remaining} daqiqa</b> qoldi. Keling, <b>Unit 4 — Animals</b> mavzusini davom ettiramiz!
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            <button
              onClick={() => navigate('/app/learn')}
              className="bg-white text-[#16A34A] font-display font-extrabold text-[15px] border-none rounded-[14px] py-[13px] px-6 cursor-pointer"
              style={{ boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}
            >
              Davom ettirish →
            </button>
            <button
              onClick={() => navigate('/app/battle')}
              className="bg-white/[.16] text-white font-display font-bold text-[15px] border-2 border-white/40 rounded-[14px] py-[11px] px-[22px] cursor-pointer"
            >
              ⚔️ Batlga kirish
            </button>
          </div>
        </div>
        <div className="flex-none w-[140px] sm:w-[180px] relative z-10 animate-floaty">
          <MascotIcon size={180} className="w-full h-auto" />
        </div>
      </div>

      {/* STAT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr] gap-[18px] mt-[18px]">
        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] flex items-center gap-5 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="relative w-24 h-24 flex-none">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#EEF2F7" strokeWidth="11" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#22C55E"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display font-extrabold text-[22px] text-[#16A34A] leading-none">{goalPct}%</div>
              <div className="text-[10px] font-bold text-text-softer">maqsad</div>
            </div>
          </div>
          <div>
            <div className="text-[13px] font-bold text-text-softer">Bugungi mashg'ulot</div>
            <div className="font-display font-extrabold text-[26px] text-text">
              {goalDone} <span className="text-[15px] text-text-softer">/ {goalMin} daq</span>
            </div>
            <div className="text-[12.5px] font-bold text-primary mt-[2px]">Ajoyib! Davom eting 💪</div>
          </div>
        </div>

        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-[#FFF7ED] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 2c1 4-2 5-2 8a4 4 0 008 0c0-1-1-3-1-3 2 1 3 3 3 6a8 8 0 11-16 0c0-5 5-7 8-11z" />
              </svg>
            </div>
            <div className="text-[13px] font-bold text-text-softer">Ketma-ket kunlar</div>
          </div>
          <div className="font-display font-extrabold text-[34px] text-text leading-none">
            {streak} <span className="text-[16px] text-text-softer">kun</span>
          </div>
          <div className="flex gap-[5px] mt-3">
            {WEEK_DAYS.map((d, i) => (
              <div
                key={i}
                className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[12px] font-extrabold ${dayStyle[d.state]}`}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border-2 rounded-[22px] p-[22px] shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-[#EFF6FF] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
              </svg>
            </div>
            <div className="text-[13px] font-bold text-text-softer">Jami so'zlar</div>
          </div>
          <div className="font-display font-extrabold text-[34px] text-text leading-none">
            {wordsKnownCount} <span className="text-[16px] text-text-softer">so'z</span>
          </div>
          <div className="text-[12.5px] font-bold text-secondary mt-[10px]">Davom eting!</div>
        </div>
      </div>

      {/* LOWER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[18px] mt-[18px]">
        <div className="bg-white border border-border-2 rounded-[22px] p-6 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-[19px] text-text m-0">Bugungi mashg'ulotlar</h3>
            <span className="text-[12.5px] font-bold text-text-softer">~30 daqiqa</span>
          </div>
          <div className="flex flex-col gap-[11px]">
            <div
              onClick={() => navigate('/app/learn')}
              className="flex items-center gap-[14px] p-[14px] border border-[#DCFCE7] bg-[#F0FDF4] rounded-[16px] cursor-pointer"
            >
              <div className="w-12 h-12 flex-none rounded-[13px] bg-primary flex items-center justify-center text-[22px]">📖</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-text truncate">So'z o'rganish — Animals</div>
                <div className="text-[12.5px] font-bold text-[#16A34A]">12 ta yangi so'z · 10 daqiqa</div>
              </div>
              <div className="font-extrabold text-[13px] text-primary bg-[#DCFCE7] flex-none whitespace-nowrap py-[6px] px-3 rounded-[20px]">Boshlash</div>
            </div>
            <div
              onClick={() => navigate('/app/quiz')}
              className="flex items-center gap-[14px] p-[14px] border border-[#FEF3C7] bg-[#FFFBEB] rounded-[16px] cursor-pointer"
            >
              <div className="w-12 h-12 flex-none rounded-[13px] bg-quiz flex items-center justify-center text-[22px]">✅</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-text truncate">Kunlik test</div>
                <div className="text-[12.5px] font-bold text-[#B45309]">10 ta savol · 7 daqiqa</div>
              </div>
              <div className="font-extrabold text-[13px] text-quiz bg-[#FEF3C7] flex-none whitespace-nowrap py-[6px] px-3 rounded-[20px]">Boshlash</div>
            </div>
          </div>
        </div>

        <div
          className="rounded-[22px] p-6 text-white"
          style={{ background: 'linear-gradient(160deg,#1E293B,#0F172A)', boxShadow: '0 10px 26px rgba(15,23,42,.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-[18px] text-white m-0">Maktab reytingi</h3>
            <span className="text-[11px] font-extrabold text-[#FACC15] bg-[#FACC15]/[.15] py-1 px-[9px] rounded-[20px]">TOP 5</span>
          </div>
          <div className="flex flex-col gap-[9px]">
            {!leaderboard ? (
              <div className="text-[13px] font-bold text-white/60 py-2">Yuklanmoqda…</div>
            ) : (
              leaderboard.board.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-[11px] py-[9px] px-[11px] rounded-[13px]"
                  style={{
                    background: p.isMe ? 'rgba(34,197,94,.16)' : 'rgba(255,255,255,.05)',
                    border: p.isMe ? '1px solid rgba(34,197,94,.4)' : 'none',
                  }}
                >
                  <span
                    className="w-6 h-6 flex-none rounded-[8px] flex items-center justify-center font-extrabold text-[12px]"
                    style={rankBadgeStyle(p.rank - 1)}
                  >
                    {p.rank}
                  </span>
                  <span className="flex-1 min-w-0 truncate font-bold text-[14px]" style={{ color: p.isMe ? '#86EFAC' : '#fff' }}>
                    {p.name}
                  </span>
                  <span className="font-extrabold text-[13px] text-[#FACC15] flex-none">{p.xp}</span>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate('/app/leaders')}
            className="w-full mt-[14px] bg-white/10 text-white border border-white/[.18] rounded-[12px] py-[10px] font-bold text-[13px] cursor-pointer font-sans"
          >
            To'liq reytingni ko'rish →
          </button>
        </div>
      </div>
    </div>
  );
}
