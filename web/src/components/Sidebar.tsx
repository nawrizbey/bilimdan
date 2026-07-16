import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogoMark } from './LogoMark';
import { useAppStore } from '../store/useAppStore';
import { NAV_ITEMS } from '../lib/navItems';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const goalMin = useAppStore((s) => s.goalMin);
  const goalDone = useAppStore((s) => s.goalDone);
  const role = useAppStore((s) => s.role);
  const goalPct = Math.min(100, Math.round((goalDone / goalMin) * 100));
  const location = useLocation();
  const navItems = NAV_ITEMS.filter((item) => !item.teacherOnly || role === 'teacher');

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-[#0F172A]/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-[260px] flex-none bg-white border-r border-border flex flex-col p-[22px_16px] fixed lg:sticky top-0 h-screen overflow-y-auto z-40 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        aria-label={t('nav.ariaMain') ?? undefined}
      >
        <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
          <LogoMark />
          <div className="flex-1">
            <div className="font-display font-extrabold text-[20px] leading-none text-text">{t('common.appName')}</div>
            <div className="text-[11px] font-bold text-primary tracking-[.04em]">{t('nav.grade')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('nav.closeMenu') ?? undefined}
            className="lg:hidden flex-none w-8 h-8 rounded-[9px] flex items-center justify-center text-text-soft hover:bg-border-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-[11px] w-full text-left border-none cursor-pointer font-sans font-bold text-[14.5px] py-[11px] px-3 rounded-[13px] transition-colors ${
                  isActive ? 'bg-border-3 text-text' : 'text-text-soft hover:bg-border-3/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="w-[10px] h-[10px] rounded-[4px] flex-none"
                    style={{
                      background: item.color,
                      boxShadow: isActive ? `0 0 0 4px ${item.color}33` : 'none',
                    }}
                  />
                  <span>{t(item.labelKey)}</span>
                  {item.badgeKey && (
                    <span className="ml-auto bg-battle text-white text-[10px] font-extrabold py-[2px] px-[7px] rounded-[20px]">
                      {t(item.badgeKey)}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className="mt-[14px] rounded-[18px] p-4"
          style={{
            background: 'linear-gradient(160deg,#EFF6FF,#DBEAFE)',
            border: '1px solid #BFDBFE',
          }}
        >
          <div className="font-display font-bold text-[15px] text-[#1E40AF]">{t('nav.todayGoal')}</div>
          <div className="text-[12.5px] text-secondary font-bold my-[3px] mb-[10px]">
            {goalDone} / {goalMin} {t('common.minutes')}
          </div>
          <div className="h-[9px] bg-white rounded-[20px] overflow-hidden">
            <div
              className="h-full rounded-[20px] transition-all"
              style={{ width: `${goalPct}%`, background: 'linear-gradient(90deg,#3B82F6,#2563EB)' }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
