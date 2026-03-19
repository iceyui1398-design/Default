import { useAppStore } from '../store/useAppStore';
import { MatchCard } from '../components/MatchCard';

export function UpcomingPage() {
  const { fixtures } = useAppStore();

  const now = new Date();
  const upcoming = fixtures
    .filter(f => {
      const matchDate = new Date(f.fixture?.date);
      const diff = matchDate.getTime() - now.getTime();
      return diff > -3 * 60 * 60 * 1000; // include matches from 3h ago
    })
    .sort((a, b) => new Date(a.fixture?.date).getTime() - new Date(b.fixture?.date).getTime());

  // Group by date
  const groups: Record<string, typeof upcoming> = {};
  for (const match of upcoming) {
    const date = new Date(match.fixture?.date).toLocaleDateString([], {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(match);
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
        <div className="text-5xl">📅</div>
        <h2 className="text-white font-semibold text-lg">No matches loaded</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Configure your RapidAPI key in <code className="text-emerald-400 text-xs">server/.env</code> to fetch live fixture data.
        </p>
        <div className="bg-slate-800/60 rounded-xl p-4 text-left text-xs text-slate-400 w-full max-w-xs">
          <p className="font-mono text-emerald-400 mb-1">server/.env</p>
          <p className="font-mono">RAPIDAPI_KEY=your_key</p>
          <p className="font-mono">ODDS_API_KEY=your_key</p>
          <p className="font-mono">ANTHROPIC_API_KEY=your_key</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {Object.entries(groups).map(([date, matches]) => (
        <div key={date}>
          <div className="px-4 py-2 sticky top-[105px] bg-slate-900/95 backdrop-blur z-10">
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{date}</h2>
          </div>
          <div className="px-4 space-y-3">
            {matches.map(match => (
              <MatchCard key={match.fixture?.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
