import type { MatchData } from '../lib/types';

interface Props {
  match: MatchData;
}

function StatRow({ label, home, away }: { label: string; home: string | number; away: string | number }) {
  const homeNum = typeof home === 'string' ? parseFloat(home.replace('%', '')) : home;
  const awayNum = typeof away === 'string' ? parseFloat(away.replace('%', '')) : away;
  const total = homeNum + awayNum;
  const homeWidth = total > 0 ? (homeNum / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-emerald-400 font-semibold">{home}</span>
        <span className="text-slate-400">{label}</span>
        <span className="text-blue-400 font-semibold">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
        <div
          className="bg-emerald-400/70 transition-all duration-700"
          style={{ width: `${homeWidth}%` }}
        />
        <div
          className="bg-blue-400/70 transition-all duration-700"
          style={{ width: `${100 - homeWidth}%` }}
        />
      </div>
    </div>
  );
}

export function LiveStats({ match }: Props) {
  const stats = match.statistics;

  if (!stats || stats.length < 2) {
    return (
      <div className="text-center text-slate-500 py-4 text-sm">
        Live stats loading...
      </div>
    );
  }

  const homeStat = stats[0]?.statistics || [];
  const awayStat = stats[1]?.statistics || [];

  const getStat = (statsArr: typeof homeStat, type: string) => {
    const found = statsArr.find(s => s.type === type);
    return found?.value ?? 0;
  };

  const statPairs = [
    { label: 'Possession', home: getStat(homeStat, 'Ball Possession'), away: getStat(awayStat, 'Ball Possession') },
    { label: 'Shots on Target', home: getStat(homeStat, 'Shots on Goal'), away: getStat(awayStat, 'Shots on Goal') },
    { label: 'Total Shots', home: getStat(homeStat, 'Total Shots'), away: getStat(awayStat, 'Total Shots') },
    { label: 'Corners', home: getStat(homeStat, 'Corner Kicks'), away: getStat(awayStat, 'Corner Kicks') },
    { label: 'Fouls', home: getStat(homeStat, 'Fouls'), away: getStat(awayStat, 'Fouls') },
    { label: 'Yellow Cards', home: getStat(homeStat, 'Yellow Cards'), away: getStat(awayStat, 'Yellow Cards') },
  ];

  return (
    <div className="space-y-3">
      {statPairs.map(stat => (
        <StatRow
          key={stat.label}
          label={stat.label}
          home={stat.home}
          away={stat.away}
        />
      ))}
    </div>
  );
}
