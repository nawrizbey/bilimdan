import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { NAV_ITEMS } from '../lib/navItems';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const studentName = useAppStore((s) => s.studentName);
  const streak = useAppStore((s) => s.streak);
  const xp = useAppStore((s) => s.xp);
  const role = useAppStore((s) => s.role);
  const units = useAppStore((s) => s.units);
  const loadUnits = useAppStore((s) => s.loadUnits);
  const initial = studentName.charAt(0).toUpperCase();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const navMatches = q
    ? NAV_ITEMS.filter((item) => (!item.teacherOnly || role === 'teacher') && t(item.labelKey).toLowerCase().includes(q))
    : [];
  const unitMatches = q ? (units ?? []).filter((u) => u.title.toLowerCase().includes(q)) : [];
  const hasResults = navMatches.length > 0 || unitMatches.length > 0;

  const handleFocus = () => {
    setOpen(true);
    if (!units) loadUnits().catch((err) => console.error('Search units load failed:', err));
  };

  const goToNav = (to: string) => {
    setOpen(false);
    setQuery('');
    navigate(to);
  };

  const goToUnit = (unitId: number) => {
    setOpen(false);
    setQuery('');
    navigate('/app/learn', { state: { scrollToUnit: unitId } });
  };

  return (
    <header className="flex items-center gap-3 sm:gap-[18px] py-[14px] sm:py-[18px] px-4 sm:px-[34px] bg-app-bg/85 backdrop-blur-sm sticky top-0 z-20 border-b border-border-2">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t('topbar.openMenu') ?? undefined}
        className="lg:hidden flex-none w-10 h-10 rounded-[12px] bg-white border border-border flex items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div ref={containerRef} className="hidden sm:block relative w-[340px] max-w-[38%]">
        <div className="flex items-center gap-[10px] bg-white border border-border rounded-[14px] py-[10px] px-[14px]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4" className="flex-none">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={t('topbar.searchPlaceholder') ?? undefined}
            className="flex-1 min-w-0 text-text font-semibold text-[13.5px] outline-none border-none bg-transparent placeholder:text-text-softer"
          />
        </div>

        {open && q && (
          <div
            className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-border-2 rounded-[14px] overflow-hidden z-30"
            style={{ boxShadow: '0 14px 36px rgba(15,23,42,.14)' }}
          >
            {!hasResults && <div className="text-[13px] font-bold text-text-softer p-3 text-center">{t('topbar.noResults')}</div>}
            {navMatches.map((item) => (
              <button
                key={item.to}
                onClick={() => goToNav(item.to)}
                className="w-full text-left flex items-center gap-[10px] py-[10px] px-[14px] hover:bg-border-3 cursor-pointer border-none bg-transparent font-sans"
              >
                <span className="w-2 h-2 rounded-[3px] flex-none" style={{ background: item.color }} />
                <span className="text-[13.5px] font-bold text-text">{t(item.labelKey)}</span>
              </button>
            ))}
            {unitMatches.map((u) => (
              <button
                key={u.id}
                onClick={() => goToUnit(u.id)}
                className="w-full text-left flex items-center gap-[10px] py-[10px] px-[14px] hover:bg-border-3 cursor-pointer border-none bg-transparent font-sans"
              >
                <span className="text-[15px] flex-none">{u.emoji}</span>
                <span className="text-[13.5px] font-bold text-text truncate">{u.title}</span>
                <span className="ml-auto text-[11px] font-bold text-text-softer flex-none">{u.wordsCount} {t('common.words')}</span>
              </button>
            ))}
          </div>
        )}
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
