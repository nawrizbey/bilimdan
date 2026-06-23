import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MascotIcon } from '../components/MascotIcon';
import { useAppStore } from '../store/useAppStore';
import { ApiError } from '../lib/api';

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);

  const doLogin = async (u: string, p: string) => {
    if (!u.trim() || !p.trim()) {
      setError('Foydalanuvchi nomi va parolni kiriting');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(u.trim(), p, rememberMe);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tarmoqqa ulanishda xatolik. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    doLogin(username, password);
  };

  const handleDemoLogin = () => doLogin('demo', 'demo1234');

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-app-bg">
      <div
        className="lg:hidden flex items-center justify-center gap-3 py-7 px-6 text-white"
        style={{ background: 'linear-gradient(150deg,#22C55E 0%,#16A34A 55%,#15803D 100%)' }}
      >
        <MascotIcon size={48} />
        <div>
          <div className="font-display font-extrabold text-[24px] leading-none">Bilimdon</div>
          <div className="text-[12.5px] font-bold text-white/85 mt-1">So'z o'rganish platformasi</div>
        </div>
      </div>

      <div
        className="hidden lg:flex flex-1 min-w-0 flex-col items-center justify-center p-12 relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(150deg,#22C55E 0%,#16A34A 55%,#15803D 100%)' }}
      >
        <div className="absolute -right-[60px] -top-[60px] w-[300px] h-[300px] rounded-full bg-white/[.08]" />
        <div className="absolute -left-[50px] -bottom-[40px] w-[220px] h-[220px] rounded-full bg-white/[.07]" />
        <div className="animate-floaty relative z-10">
          <MascotIcon size={170} />
        </div>
        <h1 className="font-display font-extrabold text-[44px] mt-[18px] mb-[6px] relative z-10">Bilimdon</h1>
        <p className="text-[17px] font-bold text-white/90 text-center max-w-[380px] relative z-10 mb-[26px]">
          5–6 sinf o'quvchilari uchun ingliz tili so'zlarini o'yin orqali o'rganish platformasi
        </p>
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-[11px] font-bold text-[15px]">
            <span className="w-[30px] h-[30px] rounded-[9px] bg-white/20 flex items-center justify-center">🎙️</span>
            Mikrofon bilan talaffuz mashqi
          </div>
          <div className="flex items-center gap-[11px] font-bold text-[15px]">
            <span className="w-[30px] h-[30px] rounded-[9px] bg-white/20 flex items-center justify-center">⚔️</span>
            Do'stlar bilan jonli batl o'yinlari
          </div>
          <div className="flex items-center gap-[11px] font-bold text-[15px]">
            <span className="w-[30px] h-[30px] rounded-[9px] bg-white/20 flex items-center justify-center">🏆</span>
            Kunlik maqsad, streak va reyting
          </div>
        </div>
      </div>

      <div className="flex-1 lg:w-[480px] lg:flex-none flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={handleLogin} className="w-full max-w-[350px]" noValidate>
          <h2 className="font-display font-extrabold text-[28px] text-text mb-1">Xush kelibsiz! 👋</h2>
          <p className="text-[14.5px] font-bold text-text-softer mb-[26px]">Davom etish uchun hisobingizga kiring</p>

          <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">Foydalanuvchi nomi</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full py-[13px] px-[15px] border-2 border-border rounded-[14px] font-sans font-bold text-[14.5px] text-text bg-[#F8FAFC] outline-none mb-4 focus:border-primary focus:bg-white"
          />

          <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">Parol</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full py-[13px] px-[15px] border-2 border-border rounded-[14px] font-sans font-bold text-[14.5px] text-text bg-[#F8FAFC] outline-none mb-[14px] focus:border-primary focus:bg-white"
          />

          <div className="flex items-center justify-between mb-[22px]">
            <label className="flex items-center gap-[7px] text-[13px] font-bold text-text-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className="w-[18px] h-[18px] rounded-[6px] flex items-center justify-center text-white text-[11px] peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-1"
                style={{ background: rememberMe ? '#22C55E' : '#E2E8F0' }}
              >
                {rememberMe ? '✓' : ''}
              </span>
              Eslab qolish
            </label>
            <button
              type="button"
              onClick={() => setShowForgotMessage(true)}
              className="text-[13px] font-extrabold text-secondary cursor-pointer bg-transparent border-none p-0 font-sans"
            >
              Parolni unutdingizmi?
            </button>
          </div>

          {showForgotMessage && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-secondary-dark text-[13px] font-bold rounded-[12px] p-3 mb-[14px]">
              Hozircha bu funksiya mavjud emas. Parolni tiklash uchun o'qituvchingiz yoki maktab administratoriga
              murojaat qiling.
            </div>
          )}

          {error && (
            <div className="bg-danger-light border border-[#FECACA] text-danger-dark text-[13px] font-bold rounded-[12px] p-3 mb-[14px]" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white border-none rounded-[15px] py-[15px] font-display font-extrabold text-[17px] cursor-pointer mb-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 5px 0 #15803D' }}
          >
            {submitting ? 'Kuting…' : 'Kirish →'}
          </button>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full bg-white text-[#475569] border-2 border-border rounded-[15px] py-3 font-sans font-extrabold text-[14px] cursor-pointer mb-[22px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            👀 Demo sifatida ko'rish
          </button>

          <div className="text-center text-[14px] font-bold text-text-softer">
            Hisobingiz yo'qmi?{' '}
            <Link to="/signup" className="text-primary font-extrabold">
              Ro'yxatdan o'ting
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
