import { useTranslation } from 'react-i18next';
import { useOfflineSync } from '../lib/useOfflineSync';

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOfflineSync();

  if (online) return null;

  return (
    <div className="bg-[#FEF3C7] text-[#92400E] border-b border-[#FDE68A] text-[13px] font-bold text-center py-2 px-4">
      📡 {t('offline.banner')}
    </div>
  );
}
