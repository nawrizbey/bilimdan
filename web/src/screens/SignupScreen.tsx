import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components/LogoMark';
import { useAppStore } from '../store/useAppStore';
import { ApiError } from '../lib/api';
import { getErrorMessage } from '../lib/errorMessage';

type FieldErrors = Partial<Record<'fullName' | 'username' | 'password' | 'regionId' | 'districtId' | 'schoolId', string>>;

function inputClass(hasError: boolean) {
  return `w-full py-[13px] px-[15px] border-2 rounded-[14px] font-sans font-bold text-[14.5px] text-text bg-[#F8FAFC] outline-none focus:bg-white ${
    hasError ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
  }`;
}

function selectClass(hasError: boolean) {
  return `w-full py-[13px] px-[15px] border-2 rounded-[14px] font-sans font-bold text-[14.5px] text-text bg-[#F8FAFC] outline-none appearance-none focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
    hasError ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
  }`;
}

export function SignupScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useAppStore((s) => s.signupForm);
  const setSignupField = useAppStore((s) => s.setSignupField);
  const signup = useAppStore((s) => s.signup);
  const locations = useAppStore((s) => s.locations);
  const loadLocations = useAppStore((s) => s.loadLocations);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const districtOpts = locations?.regions.find((r) => r.id === form.regionId)?.districts ?? [];
  const schoolOpts = districtOpts.find((d) => d.id === form.districtId)?.schools ?? [];
  const districtDisabled = !form.regionId;
  const schoolDisabled = !form.districtId;

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2) {
      next.fullName = t('signup.fullNameError');
    }
    if (form.username.trim().length < 3) {
      next.username = t('signup.usernameError');
    }
    if (form.password.length < 6) {
      next.password = t('signup.passwordError');
    }
    if (!form.regionId) next.regionId = t('signup.regionError');
    if (!form.districtId) next.districtId = t('signup.districtError');
    if (!form.schoolId) next.schoolId = t('signup.schoolError');
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await signup();
      navigate('/app/dashboard');
    } catch (err) {
      setFormError(err instanceof ApiError ? getErrorMessage(t, err) : t('common.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-app-bg p-4 sm:p-10"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 20%,#DCFCE7,transparent 40%),radial-gradient(circle at 85% 80%,#DBEAFE,transparent 40%)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[440px] bg-white border border-border-2 rounded-[26px] p-5 sm:p-9"
        style={{ boxShadow: '0 18px 50px rgba(15,23,42,.1)' }}
      >
        <div className="flex items-center gap-[11px] mb-[22px]">
          <LogoMark size={46} />
          <div>
            <div className="font-display font-extrabold text-[22px] text-text leading-none">{t('login.heroTitle')}</div>
            <div className="text-[12px] font-extrabold text-primary">{t('signup.title')}</div>
          </div>
        </div>

        <div className="mb-[14px]">
          <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">{t('signup.fullName')}</label>
          <input
            type="text"
            placeholder={t('signup.fullNamePlaceholder') ?? undefined}
            value={form.fullName}
            onChange={(e) => setSignupField('fullName', e.target.value)}
            className={inputClass(!!errors.fullName)}
          />
          {errors.fullName && <div className="text-[12px] font-bold text-danger-dark mt-1">{errors.fullName}</div>}
        </div>

        <div className="flex gap-3 mb-[14px]">
          <div className="flex-1">
            <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">{t('signup.username')}</label>
            <input
              type="text"
              placeholder={t('signup.usernamePlaceholder') ?? undefined}
              value={form.username}
              onChange={(e) => setSignupField('username', e.target.value)}
              className={inputClass(!!errors.username)}
            />
            {errors.username && <div className="text-[12px] font-bold text-danger-dark mt-1">{errors.username}</div>}
          </div>
          <div className="flex-1">
            <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">{t('signup.password')}</label>
            <input
              type="password"
              placeholder="••••••"
              value={form.password}
              onChange={(e) => setSignupField('password', e.target.value)}
              className={inputClass(!!errors.password)}
            />
            {errors.password && <div className="text-[12px] font-bold text-danger-dark mt-1">{errors.password}</div>}
          </div>
        </div>

        <label className="text-[13px] font-extrabold text-[#475569] mb-[6px] block">{t('signup.locationLabel')}</label>
        <div className="relative mb-1">
          <select
            value={form.regionId ?? ''}
            onChange={(e) => setSignupField('regionId', e.target.value ? Number(e.target.value) : null)}
            className={selectClass(!!errors.regionId)}
          >
            <option value="">{t('signup.regionPlaceholder')}</option>
            {locations?.regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className="absolute right-[15px] top-1/2 -translate-y-1/2 pointer-events-none text-text-softer text-[11px]">▼</span>
        </div>
        {errors.regionId && <div className="text-[12px] font-bold text-danger-dark mb-2">{errors.regionId}</div>}

        <div className="flex gap-3 mb-1 mt-[12px]">
          <div className="flex-1 relative">
            <select
              value={form.districtId ?? ''}
              onChange={(e) => setSignupField('districtId', e.target.value ? Number(e.target.value) : null)}
              disabled={districtDisabled}
              className={selectClass(!!errors.districtId)}
            >
              <option value="">{t('signup.districtPlaceholder')}</option>
              {districtOpts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="absolute right-[13px] top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E1] text-[11px]">▼</span>
            {errors.districtId && <div className="text-[12px] font-bold text-danger-dark mt-1">{errors.districtId}</div>}
          </div>
          <div className="flex-1 relative">
            <select
              value={form.schoolId ?? ''}
              onChange={(e) => setSignupField('schoolId', e.target.value ? Number(e.target.value) : null)}
              disabled={schoolDisabled}
              className={selectClass(!!errors.schoolId)}
            >
              <option value="">{t('signup.schoolPlaceholder')}</option>
              {schoolOpts.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name}
                </option>
              ))}
            </select>
            <span className="absolute right-[13px] top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E1] text-[11px]">▼</span>
            {errors.schoolId && <div className="text-[12px] font-bold text-danger-dark mt-1">{errors.schoolId}</div>}
          </div>
        </div>

        <label className="text-[13px] font-extrabold text-[#475569] mb-2 mt-5 block">{t('signup.gradeLabel')}</label>
        <div className="flex gap-3 mb-6">
          {(['5', '6'] as const).map((g) => {
            const active = form.grade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSignupField('grade', g)}
                className="flex-1 py-3 rounded-[14px] font-display font-extrabold text-[16px] cursor-pointer border-2"
                style={{
                  borderColor: active ? '#22C55E' : '#E8EDF3',
                  background: active ? '#F0FDF4' : '#fff',
                  color: active ? '#16A34A' : '#64748B',
                }}
              >
                {t('signup.grade', { grade: g })}
              </button>
            );
          })}
        </div>

        {formError && (
          <div className="bg-danger-light border border-[#FECACA] text-danger-dark text-[13px] font-bold rounded-[12px] p-3 mb-[18px]" role="alert">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white border-none rounded-[15px] py-[15px] font-display font-extrabold text-[17px] cursor-pointer mb-[18px] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 5px 0 #15803D' }}
        >
          {submitting ? t('common.submitting') : t('signup.submit')}
        </button>
        <div className="text-center text-[14px] font-bold text-text-softer">
          {t('signup.haveAccount')}{' '}
          <Link to="/login" className="text-primary font-extrabold">
            {t('signup.loginLink')}
          </Link>
        </div>
      </form>
    </div>
  );
}
