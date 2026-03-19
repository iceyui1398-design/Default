import type { RecommendedBet } from '../lib/types';
import { ConfidenceMeter } from './ConfidenceMeter';

interface Props {
  bet: RecommendedBet;
  index: number;
}

const valueColors = {
  'Good Value': 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  'Fair': 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  'Avoid': 'bg-red-500/20 border-red-500/40 text-red-400',
};

const riskColors = {
  'Low': 'text-emerald-400',
  'Medium': 'text-amber-400',
  'High': 'text-red-400',
};

const marketIcons: Record<string, string> = {
  '1X2': '🏆',
  'Over/Under': '📊',
  'BTTS': '⚡',
  'Asian Handicap': '🎯',
};

export function BetCard({ bet }: Props) {
  const isSkip = bet.pick === 'SKIP';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      isSkip
        ? 'bg-slate-800/40 border-slate-700/40'
        : 'bg-slate-800/70 border-slate-700/50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{marketIcons[bet.market] || '📌'}</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{bet.market}</span>
          </div>
          <div className={`text-lg font-bold ${isSkip ? 'text-slate-500' : 'text-white'}`}>
            {bet.pick}
          </div>
        </div>

        {!isSkip && <ConfidenceMeter confidence={bet.confidence} size="md" />}
      </div>

      {/* Odds & Tags */}
      {!isSkip && (
        <div className="flex items-center gap-2 flex-wrap">
          {bet.odds && (
            <div className="bg-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Odds</span>
              <span className="text-white font-bold">{bet.odds.toFixed(2)}</span>
            </div>
          )}
          <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${valueColors[bet.value_rating] || valueColors.Fair}`}>
            {bet.value_rating}
          </span>
          <span className={`text-xs font-medium ${riskColors[bet.risk_level]}`}>
            {bet.risk_level} Risk
          </span>
        </div>
      )}

      {/* Reasoning */}
      <p className="text-slate-300 text-sm leading-relaxed">
        {bet.reasoning}
      </p>
    </div>
  );
}
