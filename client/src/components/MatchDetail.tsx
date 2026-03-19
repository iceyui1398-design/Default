import { useState, useEffect } from 'react';
import type { MatchData, Analysis, InjuredPlayer } from '../lib/types';
import { fetchFixtureDetail, triggerAnalysis } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { BetCard } from './BetCard';
import { StatsChart } from './StatsChart';
import { LiveStats } from './LiveStats';
interface Props {
  fixtureId: number;
  onClose: () => void;
}

type DetailTab = 'analysis' | 'stats' | 'h2h' | 'injuries';

function H2HMiniMatch({ match, homeTeamId }: { match: MatchData; homeTeamId: number }) {
  const isHome = match.teams?.home?.id === homeTeamId;
  const homeGoals = isHome ? match.goals?.home : match.goals?.away;
  const awayGoals = isHome ? match.goals?.away : match.goals?.home;
  const date = match.fixture?.date ? new Date(match.fixture.date) : null;
  const won = (homeGoals ?? 0) > (awayGoals ?? 0);
  const lost = (homeGoals ?? 0) < (awayGoals ?? 0);

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
      won ? 'bg-emerald-900/30' : lost ? 'bg-red-900/30' : 'bg-slate-800/50'
    }`}>
      <span className="text-slate-400 text-xs w-16">
        {date?.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
      </span>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <span className="text-slate-300 text-xs truncate max-w-[80px] text-right">{match.teams?.home?.name}</span>
        <span className={`font-bold text-sm ${won && isHome ? 'text-emerald-400' : 'text-white'}`}>
          {match.goals?.home} - {match.goals?.away}
        </span>
        <span className="text-slate-300 text-xs truncate max-w-[80px]">{match.teams?.away?.name}</span>
      </div>
      <span className={`text-xs font-bold w-6 text-right ${won ? 'text-emerald-400' : lost ? 'text-red-400' : 'text-slate-400'}`}>
        {won ? 'W' : lost ? 'L' : 'D'}
      </span>
    </div>
  );
}

export function MatchDetail({ fixtureId, onClose }: Props) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchFixtureDetail>> | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('analysis');
  const [error, setError] = useState<string | null>(null);
  const { liveMatches, analyses, setAnalysis: storeSetAnalysis, apiHealth } = useAppStore();

  useEffect(() => {
    setError(null);
    fetchFixtureDetail(fixtureId)
      .then(d => {
        setDetail(d);
        if (d.analysis) {
          setAnalysis(d.analysis);
          storeSetAnalysis(fixtureId, d.analysis);
        }
      })
      .catch(err => setError(err.message));
  }, [fixtureId]);

  // Check for live match data
  const liveMatch = liveMatches.find(m => m.fixture?.id === fixtureId);
  const cachedAnalysis = analyses[String(fixtureId)];

  const handleAnalyze = async (force = false) => {
    if (!apiHealth?.anthropic && !force) {
      setError('Anthropic API key not configured. Add ANTHROPIC_API_KEY to server/.env');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await triggerAnalysis(fixtureId, force);
      setAnalysis(result);
      storeSetAnalysis(fixtureId, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  type FixtureObj = NonNullable<typeof detail>['fixture'];
  const fixture: FixtureObj | null = detail?.fixture || (liveMatch
    ? { fixture: liveMatch.fixture, teams: liveMatch.teams, goals: liveMatch.goals, league: liveMatch.league } as unknown as FixtureObj
    : null);
  const homeTeam = fixture?.teams?.home || detail?.fixture?.teams?.home;
  const awayTeam = fixture?.teams?.away || detail?.fixture?.teams?.away;
  const currentAnalysis = analysis || cachedAnalysis;

  const detailTabs: { id: DetailTab; label: string }[] = [
    { id: 'analysis', label: '🤖 AI Tips' },
    { id: 'stats', label: '📊 Stats' },
    { id: 'h2h', label: '🔄 H2H' },
    { id: 'injuries', label: '🏥 Squad' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      {/* Close / Back */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ← Back
          </button>
          {liveMatch && (
            <div className="flex items-center gap-1 text-red-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 live-indicator" />
              LIVE {liveMatch.fixture?.status?.elapsed}'
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Match Header */}
        {fixture && (
          <div className="py-6 text-center">
            <p className="text-slate-500 text-xs mb-3">{(fixture as any).league?.name || detail?.fixture?.league?.name}</p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2 flex-1">
                {homeTeam?.logo && <img src={homeTeam.logo} alt={homeTeam.name} className="w-14 h-14 object-contain" />}
                <span className="text-white font-semibold text-sm text-center">{homeTeam?.name}</span>
              </div>
              <div className="text-center">
                {liveMatch ? (
                  <>
                    <div className="text-4xl font-bold text-white">
                      {liveMatch.goals?.home ?? 0} : {liveMatch.goals?.away ?? 0}
                    </div>
                    <div className="text-red-400 text-sm font-medium mt-1 live-indicator">
                      {liveMatch.fixture?.status?.elapsed}'
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-xl">vs</div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                {awayTeam?.logo && <img src={awayTeam.logo} alt={awayTeam.name} className="w-14 h-14 object-contain" />}
                <span className="text-white font-semibold text-sm text-center">{awayTeam?.name}</span>
              </div>
            </div>

            {/* Odds row */}
            {detail?.odds && (
              <div className="flex justify-center gap-3 mt-4">
                <OddsChip label={homeTeam?.name?.split(' ').pop() || 'H'} value={detail.odds.home_win} />
                <OddsChip label="Draw" value={detail.odds.draw} />
                <OddsChip label={awayTeam?.name?.split(' ').pop() || 'A'} value={detail.odds.away_win} />
                {detail.odds.over_2_5 && <OddsChip label="O2.5" value={detail.odds.over_2_5} />}
              </div>
            )}
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 mb-4">
          {detailTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {!currentAnalysis ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl">🤖</div>
                <p className="text-slate-400">Get AI-powered betting analysis for this match</p>
                {!apiHealth?.anthropic && (
                  <p className="text-amber-400 text-xs">Configure ANTHROPIC_API_KEY in server/.env to enable AI analysis</p>
                )}
                <button
                  onClick={() => handleAnalyze(false)}
                  disabled={isAnalyzing}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                  {isAnalyzing ? '⏳ Analyzing...' : '⚡ Analyze Match'}
                </button>
              </div>
            ) : (
              <>
                {/* Analysis header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      currentAnalysis.analysis_type === 'live'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {currentAnalysis.analysis_type === 'live' ? '🔴 Live Analysis' : '📋 Pre-match Analysis'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAnalyze(true)}
                    disabled={isAnalyzing}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    {isAnalyzing ? '⏳' : '🔄'} Refresh
                  </button>
                </div>

                {/* Key Factors */}
                {currentAnalysis.key_factors?.length > 0 && (
                  <div className="bg-slate-800/60 rounded-2xl p-4 space-y-2">
                    <h3 className="text-white font-semibold text-sm mb-3">Key Factors</h3>
                    {currentAnalysis.key_factors.map((factor, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span className="text-slate-300">{factor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Avoid Flags */}
                {currentAnalysis.avoid_flags?.length > 0 && (
                  <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-4 space-y-2">
                    <h3 className="text-amber-400 font-semibold text-sm mb-2">⚠️ Risk Flags</h3>
                    {currentAnalysis.avoid_flags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-500 mt-0.5">!</span>
                        <span className="text-amber-200">{flag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended Bets */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold text-sm">Recommended Bets</h3>
                  {currentAnalysis.recommended_bets?.map((bet, i) => (
                    <BetCard key={i} bet={bet} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {liveMatch && (
              <div className="bg-slate-800/60 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-4">Live Match Stats</h3>
                <LiveStats match={liveMatch} />
              </div>
            )}

            {currentAnalysis?.stats_snapshot && (
              <div className="bg-slate-800/60 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-4">Performance Comparison</h3>
                <StatsChart
                  stats={currentAnalysis.stats_snapshot}
                  homeTeamName={homeTeam?.name || 'Home'}
                  awayTeamName={awayTeam?.name || 'Away'}
                />
              </div>
            )}

            {!liveMatch && !currentAnalysis?.stats_snapshot && (
              <div className="text-center py-8 text-slate-500">
                <p>Run AI analysis to see stats comparison</p>
              </div>
            )}
          </div>
        )}

        {/* H2H Tab */}
        {activeTab === 'h2h' && (
          <div className="space-y-3">
            {detail?.h2h && detail.h2h.length > 0 ? (
              <>
                {/* H2H Summary */}
                {currentAnalysis?.stats_snapshot && (
                  <div className="bg-slate-800/60 rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-emerald-400 text-xl font-bold">{currentAnalysis.stats_snapshot.h2h_home_win_pct}%</div>
                        <div className="text-slate-400 text-xs">{homeTeam?.name?.split(' ').slice(-1)[0]} Win</div>
                      </div>
                      <div>
                        <div className="text-white text-xl font-bold">{currentAnalysis.stats_snapshot.h2h_avg_goals}</div>
                        <div className="text-slate-400 text-xs">Avg Goals</div>
                      </div>
                      <div>
                        <div className="text-blue-400 text-xl font-bold">{100 - currentAnalysis.stats_snapshot.h2h_home_win_pct}%</div>
                        <div className="text-slate-400 text-xs">{awayTeam?.name?.split(' ').slice(-1)[0]} Win</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {detail.h2h.slice(0, 10).map((match, i) => (
                    <H2HMiniMatch
                      key={i}
                      match={match as unknown as MatchData}
                      homeTeamId={homeTeam?.id || 0}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>H2H data not available</p>
                <p className="text-xs mt-1">Configure RapidAPI key to fetch head-to-head data</p>
              </div>
            )}
          </div>
        )}

        {/* Injuries Tab */}
        {activeTab === 'injuries' && (
          <div className="space-y-4">
            {detail?.injuries && (detail.injuries.home.length > 0 || detail.injuries.away.length > 0) ? (
              <>
                <InjurySection
                  title={homeTeam?.name || 'Home Team'}
                  logo={homeTeam?.logo}
                  injuries={detail.injuries.home as InjuredPlayer[]}
                  impact={currentAnalysis?.stats_snapshot?.injury_impact_home}
                />
                <InjurySection
                  title={awayTeam?.name || 'Away Team'}
                  logo={awayTeam?.logo}
                  injuries={detail.injuries.away as InjuredPlayer[]}
                  impact={currentAnalysis?.stats_snapshot?.injury_impact_away}
                />
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No injury data available</p>
                <p className="text-xs mt-1">Configure RapidAPI key to fetch squad data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OddsChip({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-center min-w-[50px]">
      <div className="text-slate-400 text-[10px]">{label}</div>
      <div className="text-white font-bold text-sm">{value.toFixed(2)}</div>
    </div>
  );
}

function InjurySection({
  title,
  logo,
  injuries,
  impact,
}: {
  title: string;
  logo?: string;
  injuries: InjuredPlayer[];
  impact?: string;
}) {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {logo && <img src={logo} alt={title} className="w-6 h-6 object-contain" />}
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
        {impact && <ImpactBadge impact={impact} />}
      </div>
      {injuries.length === 0 ? (
        <p className="text-slate-500 text-sm">No known injuries</p>
      ) : (
        <div className="space-y-2">
          {injuries.map((inj, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/40 last:border-0">
              <div>
                <div className="text-white text-sm font-medium">{inj.player?.name}</div>
                <div className="text-slate-400 text-xs">{inj.player?.position}</div>
              </div>
              <div className="text-right">
                <div className="text-red-400 text-xs">{inj.player?.reason || 'Injured'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const colors: Record<string, string> = {
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${colors[impact] || colors.Low}`}>
      {impact} Impact
    </span>
  );
}
