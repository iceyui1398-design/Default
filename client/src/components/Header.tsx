import { useAppStore } from '../store/useAppStore';

export function Header() {
  const { isConnected, apiHealth, liveMatches } = useAppStore();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FootballIQ</h1>
            <p className="text-slate-400 text-xs">AI Betting Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveMatches.length > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-red-400 live-indicator" />
              <span className="text-red-400 text-xs font-medium">{liveMatches.length} LIVE</span>
            </div>
          )}

          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            isConnected
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-slate-700/50 border border-slate-600/30 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </div>

          {apiHealth && (
            <div className="flex gap-1">
              <ApiDot active={apiHealth.rapidapi} label="Football" />
              <ApiDot active={apiHealth.odds_api} label="Odds" />
              <ApiDot active={apiHealth.anthropic} label="AI" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ApiDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      title={`${label}: ${active ? 'Connected' : 'Not configured'}`}
      className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-600'}`}
    />
  );
}
