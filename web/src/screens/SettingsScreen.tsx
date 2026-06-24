import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

const TOGGLES: { key: 'mic' | 'head' | 'sfx' | 'notify'; emoji: string; titleKey: string; descKey: string }[] = [
  { key: 'mic', emoji: '🎙️', titleKey: 'settings.micTitle', descKey: 'settings.micDesc' },
  { key: 'head', emoji: '🎧', titleKey: 'settings.headTitle', descKey: 'settings.headDesc' },
  { key: 'sfx', emoji: '🔔', titleKey: 'settings.sfxTitle', descKey: 'settings.sfxDesc' },
  { key: 'notify', emoji: '📅', titleKey: 'settings.notifyTitle', descKey: 'settings.notifyDesc' },
];

const GOAL_OPTIONS = [15, 20, 30, 45];

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const toggleSetting = useAppStore((s) => s.toggleSetting);
  const goalMin = useAppStore((s) => s.goalMin);
  const setGoalMin = useAppStore((s) => s.setGoalMin);
  const logout = useAppStore((s) => s.logout);

  return (
    <div className="animate-pop max-w-[680px] mx-auto">
      <h2 className="font-display font-extrabold text-[25px] mb-[22px] text-text">{t('settings.title')}</h2>

      <div className="bg-white border border-border-2 rounded-[22px] p-[8px_22px] mb-[18px]" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
        <div className="py-[18px] border-b border-border-3">
          <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em]">{t('settings.audioSection')}</div>
        </div>
        {TOGGLES.map((toggle) => {
          const on = settings[toggle.key];
          return (
            <div key={toggle.key} className="flex items-center gap-[14px] py-4 border-b border-border-3 last:border-b-0">
              <div className="w-[42px] h-[42px] flex-none rounded-xl flex items-center justify-center text-[21px] bg-border-3">
                {toggle.emoji}
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[15px] text-text">{t(toggle.titleKey)}</div>
                <div className="text-[12.5px] font-bold text-text-softer">{t(toggle.descKey)}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={t(toggle.titleKey) ?? undefined}
                onClick={() => toggleSetting(toggle.key)}
                className="w-[50px] h-7 rounded-[20px] flex-none cursor-pointer p-[3px] border-none transition-colors flex focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
                style={{ background: on ? '#22C55E' : '#CBD5E1', justifyContent: on ? 'flex-end' : 'flex-start' }}
              >
                <span className="w-[22px] h-[22px] rounded-full bg-white block" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-border-2 rounded-[22px] p-[22px] mb-[18px]" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
        <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em] mb-[14px]">{t('settings.goalSection')}</div>
        <div className="flex items-center justify-between mb-[10px]">
          <span className="font-extrabold text-[15px] text-text">{t('settings.goalLabel')}</span>
          <span className="font-display font-extrabold text-[18px] text-primary">{goalMin} {t('common.minutes')}</span>
        </div>
        <div className="flex gap-[10px]">
          {GOAL_OPTIONS.map((m) => {
            const on = goalMin === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => setGoalMin(m)}
                className="flex-1 p-3 rounded-[13px] border-2 font-display font-extrabold text-[14.5px] cursor-pointer transition-all"
                style={{
                  borderColor: on ? '#22C55E' : '#E8EDF3',
                  background: on ? '#F0FDF4' : '#F8FAFC',
                  color: on ? '#15803D' : '#64748B',
                }}
              >
                {m} {t('common.minutes')}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="w-full bg-danger-light text-danger-dark border-[1.5px] border-[#FECACA] rounded-[15px] p-[15px] font-display font-extrabold text-[16px] cursor-pointer"
      >
        {t('settings.logout')}
      </button>
    </div>
  );
}
