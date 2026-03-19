import { useAppStore } from '../store/useAppStore';

type Tab = 'upcoming' | 'live' | 'analyses';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'upcoming', label: 'Matches', icon: '📅' },
  { id: 'live', label: 'Live', icon: '🔴' },
  { id: 'analyses', label: 'Tips', icon: '🤖' },
];

export function TabBar() {
  const { activeTab, setActiveTab, liveMatches } = useAppStore();

  return (
    <nav className="sticky top-[57px] z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'live' && liveMatches.length > 0 && (
              <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                {liveMatches.length}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
