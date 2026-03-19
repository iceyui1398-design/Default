import { useAppStore } from '../store/useAppStore';

const icons: Record<string, string> = {
  goal: '⚽',
  red_card: '🟥',
  odds: '📊',
  info: 'ℹ️',
};

const colors: Record<string, string> = {
  goal: 'bg-emerald-900/90 border-emerald-600/50 text-emerald-200',
  red_card: 'bg-red-900/90 border-red-600/50 text-red-200',
  odds: 'bg-amber-900/90 border-amber-600/50 text-amber-200',
  info: 'bg-slate-800/90 border-slate-600/50 text-slate-200',
};

export function NotificationBar() {
  const { notifications, dismissNotification } = useAppStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-[110px] left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`slide-in flex items-center gap-2 rounded-xl border px-3 py-2.5 pointer-events-auto ${colors[n.type] || colors.info}`}
          >
            <span className="text-lg">{icons[n.type] || '📌'}</span>
            <span className="flex-1 text-sm font-medium">{n.message}</span>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
