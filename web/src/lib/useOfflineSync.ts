import { useEffect, useState } from 'react';
import { flushOfflineQueue } from './offlineQueue';

/** Tracks `navigator.onLine` for the offline banner, and flushes the queued
 * offline answers on app start and whenever the browser regains connectivity. */
export function useOfflineSync(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    void flushOfflineQueue();

    function handleOnline() {
      setOnline(true);
      void flushOfflineQueue();
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
