const LAST_NOTIFIED_KEY = 'bilimdon_goal_notified_date';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Best-effort daily-goal nudge via the Notifications API. Only fires while the app
 * is open (no service worker / push backend), once per day, and only if the user
 * hasn't already hit their daily goal. Gated by the "Eslatmalar" setting at the call site. */
export function maybeNotifyDailyGoal(goalDone: number, goalMin: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (goalDone >= goalMin) return;
  if (localStorage.getItem(LAST_NOTIFIED_KEY) === todayKey()) return;

  const fire = () => {
    localStorage.setItem(LAST_NOTIFIED_KEY, todayKey());
    new Notification('Bilimdon', {
      body: `Bugungi ${goalMin} daqiqalik maqsadingizdan ${goalMin - goalDone} daqiqa qoldi. Davom etamizmi? 💪`,
      icon: '/favicon.svg',
    });
  };

  if (Notification.permission === 'granted') {
    fire();
  } else if (Notification.permission === 'default') {
    void Notification.requestPermission().then((permission) => {
      if (permission === 'granted') fire();
    });
  }
}
