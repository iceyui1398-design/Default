import { useState, useEffect } from 'react';
import { fetchAllAnalyses } from '../lib/api';
import type { Analysis } from '../lib/types';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { useAppStore } from '../store/useAppStore';

function ValueBadge({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    'Good Value': 'bg-emerald-500/20 text-emerald-400',
    'Fair': 'bg-amber-500/20 text-amber-400',
    'Avoid': 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${colors[rating] || colors.Fair}`}>
      {rating}
    </span>
  );
}

function AnalysisCard({ analysis }: { analysis: Analysis & { fixture_id?: string } }) {
  const { setSelectedFixtureId, setActiveTab } = useAppStore();
  const topBet = analysis.recommended_bets?.find(b => b.pick !== 'SKIP' && b.confidence >= 62);
  const skipBets = analysis.recommended_bets?.filter(b => b.pick === 'SKIP').length;

  const handleClick = () => {
    if (analysis.fixture_id || analysis._fixture_id) {
      setSelectedFixtureId(Number(analysis.fixture_id || analysis._fixture_id));
      setActiveTab('upcoming');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-4 text-left transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-white font-semibold text-sm">{analysis.match}</h3>
          <p className="text-slate-400 text-xs mt-0.5">{analysis.league}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          analysis.analysis_type === 'live'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-slate-700 text-slate-400'
        }`}>
          {analysis.analysis_type === 'live' ? '🔴 Live' : '📋 Pre-match'}
        </span>
      </div>

      {topBet ? (
        <div className="bg-slate-700/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs">{topBet.market}</span>
              <div className="text-white font-bold">{topBet.pick}</div>
            </div>
            <ConfidenceMeter confidence={topBet.confidence} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {topBet.odds && (
              <span className="text-white text-sm font-semibold">{topBet.odds.toFixed(2)}</span>
            )}
            <ValueBadge rating={topBet.value_rating} />
            <span className={`text-xs ${topBet.risk_level === 'Low' ? 'text-emerald-400' : topBet.risk_level === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
              {topBet.risk_level} Risk
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-700/20 rounded-xl p-3">
          <span className="text-slate-500 text-sm">
            {skipBets ? `${skipBets} market(s) flagged as SKIP (confidence below 62%)` : 'No high-confidence picks found'}
          </span>
        </div>
      )}

      {analysis.key_factors?.length > 0 && (
        <div className="mt-2 space-y-1">
          {analysis.key_factors.slice(0, 2).map((factor, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-500 mt-0.5">•</span>
              {factor}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

export function AnalysesPage() {
  const [analyses, setAnalyses] = useState<(Analysis & { fixture_id?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalyses()
      .then(data => setAnalyses(data as typeof analyses))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const highConfidence = analyses.filter(a =>
    a.recommended_bets?.some(b => b.pick !== 'SKIP' && b.confidence >= 70)
  );
  const goodValue = analyses.filter(a =>
    a.recommended_bets?.some(b => b.value_rating === 'Good Value')
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500">Loading analyses...</div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
        <div className="text-5xl">🤖</div>
        <h2 className="text-white font-semibold text-lg">No analyses yet</h2>
        <p className="text-slate-400 text-sm">
          Open a match from the Matches tab and tap "Analyze Match" to get AI-powered betting tips.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* Stats row */}
      <div className="py-3 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={analyses.length} icon="📊" />
        <StatCard label="High Conf." value={highConfidence.length} icon="🎯" />
        <StatCard label="Good Value" value={goodValue.length} icon="💎" />
      </div>

      {/* Analyses list */}
      {analyses.map((analysis, i) => (
        <AnalysisCard key={i} analysis={analysis} />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 text-center">
      <div className="text-xl">{icon}</div>
      <div className="text-white font-bold text-xl">{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
    </div>
  );
}
