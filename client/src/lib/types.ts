export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface FixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface Fixture {
  id: number;
  referee?: string;
  timezone: string;
  date: string;
  timestamp: number;
  periods?: { first?: number; second?: number };
  venue?: { id?: number; name?: string; city?: string };
  status: FixtureStatus;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime?: Goals;
  penalty?: Goals;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag?: string;
  season: number;
  round?: string;
}

export interface MatchData {
  fixture: Fixture;
  league: League;
  teams: { home: Team; away: Team };
  goals: Goals;
  score?: Score;
  events?: MatchEvent[];
  statistics?: TeamStatistics[];
  _meta?: {
    is_upcoming: boolean;
    is_past: boolean;
    has_analysis: boolean;
  };
}

export interface MatchEvent {
  time: { elapsed: number; extra?: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist?: { id?: number; name?: string };
  type: string;
  detail: string;
  comments?: string | null;
}

export interface StatValue {
  type: string;
  value: string | number | null;
}

export interface TeamStatistics {
  team: { id: number; name: string; logo: string };
  statistics: StatValue[];
}

export interface Odds {
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  over_2_5: number | null;
  under_2_5: number | null;
  btts_yes: number | null;
  btts_no: number | null;
}

export interface RecommendedBet {
  market: string;
  pick: string;
  confidence: number;
  odds: number;
  value_rating: 'Good Value' | 'Fair' | 'Avoid';
  reasoning: string;
  risk_level: 'Low' | 'Medium' | 'High';
}

export interface StatsSnapshot {
  h2h_home_win_pct: number;
  h2h_avg_goals: number;
  home_form_ppg: number;
  away_form_ppg: number;
  home_over25_rate: number;
  away_over25_rate: number;
  home_btts_rate: number;
  away_btts_rate: number;
  injury_impact_home: 'Low' | 'Medium' | 'High' | 'Critical';
  injury_impact_away: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface Analysis {
  match: string;
  match_date: string;
  league: string;
  analysis_type: 'pre-match' | 'live';
  recommended_bets: RecommendedBet[];
  key_factors: string[];
  avoid_flags: string[];
  stats_snapshot: StatsSnapshot;
  _cached_at?: number;
  _fixture_id?: number;
}

export interface InjuredPlayer {
  player: {
    id: number;
    name: string;
    photo?: string;
    position: string;
    reason?: string;
  };
  team: { id: number; name: string; logo: string };
}

export interface H2HMatch extends MatchData {}

export interface LiveEvent {
  type: 'goal_scored' | 'red_card' | 'live_matches_updated' | 'odds_updated' | 'odds_movement' | 'match_ended' | 'fixtures_updated';
  data: unknown;
}

export type InjuryImpact = 'Low' | 'Medium' | 'High' | 'Critical';
export type ValueRating = 'Good Value' | 'Fair' | 'Avoid';
export type RiskLevel = 'Low' | 'Medium' | 'High';
