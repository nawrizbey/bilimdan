import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const TOGGLES: { key: 'mic' | 'head' | 'sfx' | 'notify'; emoji: string; title: string; desc: string }[] = [
  { key: 'mic', emoji: '🎙️', title: 'Mikrofon', desc: 'Talaffuz mashqlari uchun' },
  { key: 'head', emoji: '🎧', title: 'Naushnik / Ovoz', desc: 'Tinglab tushunish mashqlari' },
  { key: 'sfx', emoji: '🔔', title: 'Ovoz effektlari', desc: "To'g'ri/xato javob tovushlari" },
  { key: 'notify', emoji: '📅', title: 'Eslatmalar', desc: 'Har kuni mashq qilishni eslatish' },
];

const GOAL_OPTIONS = [15, 20, 30, 45];

export function SettingsScreen() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const toggleSetting = useAppStore((s) => s.toggleSetting);
  const goalMin = useAppStore((s) => s.goalMin);
  const setGoalMin = useAppStore((s) => s.setGoalMin);
  const logout = useAppStore((s) => s.logout);

  return (
    <div className="animate-pop max-w-[680px] mx-auto">
      <h2 className="font-display font-extrabold text-[25px] mb-[22px] text-text">Sozlamalar ⚙️</h2>

      <div className="bg-white border border-border-2 rounded-[22px] p-[8px_22px] mb-[18px]" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
        <div className="py-[18px] border-b border-border-3">
          <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em]">AUDIO VA QURILMA</div>
        </div>
        {TOGGLES.map((t) => {
          const on = settings[t.key];
          return (
            <div key={t.key} className="flex items-center gap-[14px] py-4 border-b border-border-3 last:border-b-0">
              <div className="w-[42px] h-[42px] flex-none rounded-xl flex items-center justify-center text-[21px] bg-border-3">
                {t.emoji}
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[15px] text-text">{t.title}</div>
                <div className="text-[12.5px] font-bold text-text-softer">{t.desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={t.title}
                onClick={() => toggleSetting(t.key)}
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
        <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em] mb-[14px]">KUNLIK MAQSAD</div>
        <div className="flex items-center justify-between mb-[10px]">
          <span className="font-extrabold text-[15px] text-text">Har kuni mashg'ulot vaqti</span>
          <span className="font-display font-extrabold text-[18px] text-primary">{goalMin} daqiqa</span>
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
                {m} daq
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
        ↩ Hisobdan chiqish
      </button>
    </div>
  );
}
