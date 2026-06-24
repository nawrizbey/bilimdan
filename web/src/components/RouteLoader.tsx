import { useTranslation } from 'react-i18next';
import { MascotIcon } from './MascotIcon';

export function RouteLoader() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-app-bg" role="status" aria-live="polite">
      <div className="animate-floaty">
        <MascotIcon size={64} />
      </div>
      <div className="font-display font-bold text-[15px] text-text-softer">{t('routeLoader.loading')}</div>
    </div>
  );
}
