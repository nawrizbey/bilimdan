import { useAppStore } from '../store/useAppStore';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const studentName = useAppStore((s) => s.studentName);
  const streak = useAppStore((s) => s.streak);
  const xp = useAppStore((s) => s.xp);
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center gap-3 sm:gap-[18px] py-[14px] sm:py-[18px] px-4 sm:px-[34px] bg-app-bg/85 backdrop-blur-sm sticky top-0 z-20 border-b border-border-2">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Menyuni ochish"
        className="lg:hidden flex-none w-10 h-10 rounded-[12px] bg-white border border-border flex items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="hidden sm:flex items-center gap-[10px] bg-white border border-border rounded-[14px] py-[10px] px-[14px] w-[340px] max-w-[38%]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <span className="text-text-softer font-semibold text-[13.5px] truncate">So'z yoki mavzu qidirish…</span>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-[7px] bg-[#FFF7ED] border border-[#FED7AA] rounded-[13px] py-2 px-[10px] sm:px-[13px]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 2c1 4-2 5-2 8a4 4 0 008 0c0-1-1-3-1-3 2 1 3 3 3 6a8 8 0 11-16 0c0-5 5-7 8-11z" />
          </svg>
          <span className="font-extrabold text-[#B45309] text-[14px]">{streak}</span>
        </div>
        <div className="hidden sm:flex items-center gap-[7px] bg-[#FEFCE8] border border-[#FEF08A] rounded-[13px] py-2 px-[10px] sm:px-[13px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#EAB308">
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
          </svg>
          <span className="font-extrabold text-[#A16207] text-[14px]">{xp.toLocaleString('en-US')} XP</span>
        </div>
        <div
          className="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-[13px] flex-none flex items-center justify-center text-white font-display font-extrabold text-[16px] sm:text-[17px]"
          style={{
            background: 'linear-gradient(150deg,#3B82F6,#2563EB)',
            boxShadow: '0 5px 12px rgba(59,130,246,.35)',
          }}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
