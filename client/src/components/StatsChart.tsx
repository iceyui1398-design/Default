import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { StatsSnapshot } from '../lib/types';

interface Props {
  stats: StatsSnapshot;
  homeTeamName: string;
  awayTeamName: string;
}

export function StatsChart({ stats, homeTeamName, awayTeamName }: Props) {
  const radarData = [
    {
      metric: 'Form',
      home: Math.min(stats.home_form_ppg * 33, 100),
      away: Math.min(stats.away_form_ppg * 33, 100),
    },
    {
      metric: 'Over 2.5',
      home: stats.home_over25_rate,
      away: stats.away_over25_rate,
    },
    {
      metric: 'BTTS',
      home: stats.home_btts_rate,
      away: stats.away_btts_rate,
    },
    {
      metric: 'H2H Win',
      home: stats.h2h_home_win_pct,
      away: 100 - stats.h2h_home_win_pct,
    },
  ];

  const barData = [
    {
      name: 'PPG',
      home: stats.home_form_ppg,
      away: stats.away_form_ppg,
      max: 3,
    },
    {
      name: 'Over 2.5%',
      home: stats.home_over25_rate,
      away: stats.away_over25_rate,
      max: 100,
    },
    {
      name: 'BTTS%',
      home: stats.home_btts_rate,
      away: stats.away_btts_rate,
      max: 100,
    },
    {
      name: 'H2H Win%',
      home: stats.h2h_home_win_pct,
      away: 100 - stats.h2h_home_win_pct,
      max: 100,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-slate-300">{homeTeamName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-slate-300">{awayTeamName}</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Radar
              name={homeTeamName}
              dataKey="home"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.2}
            />
            <Radar
              name={awayTeamName}
              dataKey="away"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3">
        {barData.map(item => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">{item.home.toFixed(item.name === 'PPG' ? 1 : 0)}{item.name !== 'PPG' ? '%' : ''}</span>
              <span className="text-slate-500">{item.name}</span>
              <span className="text-blue-400 font-medium">{item.away.toFixed(item.name === 'PPG' ? 1 : 0)}{item.name !== 'PPG' ? '%' : ''}</span>
            </div>
            <div className="flex h-2 gap-0.5 rounded-full overflow-hidden bg-slate-700/50">
              <div
                className="bg-emerald-400/70 rounded-l-full transition-all duration-500"
                style={{ width: `${(item.home / item.max) * 50}%` }}
              />
              <div className="w-0.5 bg-slate-600" />
              <div
                className="bg-blue-400/70 rounded-r-full transition-all duration-500"
                style={{ width: `${(item.away / item.max) * 50}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
