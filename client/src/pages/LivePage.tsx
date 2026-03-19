import { useAppStore } from '../store/useAppStore';
import { MatchCard } from '../components/MatchCard';
import { LiveStats } from '../components/LiveStats';

export function LivePage() {
  const { liveMatches } = useAppStore();

  if (liveMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
        <div className="text-5xl">⏱️</div>
        <h2 className="text-white font-semibold text-lg">No live matches right now</h2>
        <p className="text-slate-400 text-sm">
          Live matches will appear here automatically when games are in progress.
        </p>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-slate-600" />
          Updates every 30 seconds when connected
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4 pb-6">
      <div className="flex items-center gap-2 py-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400 live-indicator" />
        <span className="text-white font-semibold">{liveMatches.length} Live Matches</span>
      </div>

      {liveMatches.map(match => (
        <div key={match.fixture?.id} className="space-y-2">
          <MatchCard match={match} isLive />

          {/* Quick live stats */}
          {match.statistics && match.statistics.length >= 2 && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
              <LiveStats match={match} />
            </div>
          )}

          {/* Recent events */}
          {match.events && match.events.length > 0 && (
            <div className="bg-slate-800/30 rounded-xl px-3 py-2">
              <div className="text-slate-500 text-xs mb-2">Recent Events</div>
              <div className="space-y-1">
                {match.events
                  .filter(e => ['Goal', 'Card', 'subst'].includes(e.type))
                  .slice(-5)
                  .reverse()
                  .map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 w-8">{event.time?.elapsed}'</span>
                      <span>{event.type === 'Goal' ? '⚽' : event.detail === 'Red Card' ? '🟥' : event.detail === 'Yellow Card' ? '🟨' : '🔄'}</span>
                      <span className="text-slate-300">{event.player?.name}</span>
                      <span className="text-slate-500">({event.team?.name?.split(' ').slice(-1)[0]})</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
