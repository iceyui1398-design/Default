import type { MatchData } from '../lib/types';
import { useAppStore } from '../store/useAppStore';

interface Props {
  match: MatchData;
  isLive?: boolean;
}


export function MatchCard({ match, isLive = false }: Props) {
  const { setSelectedFixtureId } = useAppStore();

  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;
  const score = match.goals;
  const status = match.fixture?.status;
  const league = match.league;
  const isUpcoming = status?.short === 'NS';
  const hasAnalysis = match._meta?.has_analysis;

  const matchDate = match.fixture?.date ? new Date(match.fixture.date) : null;
  const timeStr = matchDate
    ? matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const dateStr = matchDate
    ? matchDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <button
      onClick={() => setSelectedFixtureId(match.fixture?.id)}
      className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
    >
      {/* League & Time Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {league?.flag && (
            <img src={league.flag} alt={league.country} className="w-4 h-3 object-cover rounded-sm" />
          )}
          <span className="text-slate-400 text-xs font-medium truncate max-w-[140px]">
            {league?.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive || (!isUpcoming && status?.short !== 'FT') ? (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 live-indicator" />
              <span className="text-red-400 text-xs font-bold">{status?.elapsed || 0}'</span>
            </div>
          ) : status?.short === 'FT' ? (
            <span className="text-slate-500 text-xs font-medium">FT</span>
          ) : (
            <div className="text-right">
              <div className="text-white text-xs font-medium">{timeStr}</div>
              <div className="text-slate-500 text-[10px]">{dateStr}</div>
            </div>
          )}
          {hasAnalysis && (
            <span className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-[9px] flex items-center justify-center">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          {homeTeam?.logo && (
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-9 h-9 object-contain" />
          )}
          <span className="text-white text-xs font-semibold text-center leading-tight line-clamp-2">
            {homeTeam?.name}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center min-w-[60px]">
          {isUpcoming ? (
            <span className="text-slate-500 text-lg font-light">vs</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${score?.home !== null && score?.away !== null && score.home! > score.away! ? 'text-white' : 'text-slate-400'}`}>
                {score?.home ?? '-'}
              </span>
              <span className="text-slate-600 text-lg">:</span>
              <span className={`text-2xl font-bold ${score?.home !== null && score?.away !== null && score.away! > score.home! ? 'text-white' : 'text-slate-400'}`}>
                {score?.away ?? '-'}
              </span>
            </div>
          )}
          {match.score?.halftime && !isUpcoming && (
            <span className="text-slate-600 text-[10px] mt-0.5">
              HT {match.score.halftime.home}-{match.score.halftime.away}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          {awayTeam?.logo && (
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-9 h-9 object-contain" />
          )}
          <span className="text-white text-xs font-semibold text-center leading-tight line-clamp-2">
            {awayTeam?.name}
          </span>
        </div>
      </div>

      {/* Events row (for live matches) */}
      {isLive && match.events && match.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-1">
          {match.events.filter(e => e.type === 'Goal' || (e.type === 'Card' && e.detail === 'Red Card')).slice(-4).map((event, i) => (
            <span key={i} className="text-xs bg-slate-700/60 rounded px-1.5 py-0.5 text-slate-300">
              {event.type === 'Goal' ? '⚽' : '🟥'} {event.time?.elapsed}' {event.player?.name?.split(' ').pop()}
            </span>
          ))}
        </div>
      )}

      {/* View Analysis CTA */}
      <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between">
        <span className="text-slate-500 text-xs">{league?.round || 'Click for analysis'}</span>
        <span className="text-emerald-400 text-xs font-medium">
          {hasAnalysis ? 'View Analysis →' : 'Analyze →'}
        </span>
      </div>
    </button>
  );
}
