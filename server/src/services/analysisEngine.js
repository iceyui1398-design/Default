const Anthropic = require('@anthropic-ai/sdk');
const { saveAnalysis, getAnalysis } = require('../db/database');

const client = new Anthropic();

function calculateH2HStats(h2hMatches, homeTeamId) {
  if (!h2hMatches || h2hMatches.length === 0) {
    return {
      home_win_pct: 0,
      away_win_pct: 0,
      draw_pct: 0,
      avg_goals: 0,
      btts_rate: 0,
      over_2_5_rate: 0,
      total_matches: 0,
    };
  }

  let homeWins = 0, awayWins = 0, draws = 0;
  let totalGoals = 0;
  let btts = 0, over25 = 0;

  for (const match of h2hMatches) {
    const homeGoals = match.goals?.home ?? 0;
    const awayGoals = match.goals?.away ?? 0;
    const total = homeGoals + awayGoals;
    totalGoals += total;

    const isHome = match.teams?.home?.id === homeTeamId;
    const homeScore = isHome ? homeGoals : awayGoals;
    const awayScore = isHome ? awayGoals : homeGoals;

    if (homeScore > awayScore) homeWins++;
    else if (homeScore < awayScore) awayWins++;
    else draws++;

    if (homeGoals > 0 && awayGoals > 0) btts++;
    if (total > 2.5) over25++;
  }

  const n = h2hMatches.length;
  return {
    home_win_pct: Math.round((homeWins / n) * 100),
    away_win_pct: Math.round((awayWins / n) * 100),
    draw_pct: Math.round((draws / n) * 100),
    avg_goals: Math.round((totalGoals / n) * 10) / 10,
    btts_rate: Math.round((btts / n) * 100),
    over_2_5_rate: Math.round((over25 / n) * 100),
    total_matches: n,
  };
}

function calculateFormStats(matches, teamId) {
  if (!matches || matches.length === 0) {
    return {
      wins: 0, draws: 0, losses: 0, gf: 0, ga: 0,
      ppg: 0, clean_sheets: 0, over_2_5_rate: 0, btts_rate: 0,
      form_string: '',
    };
  }

  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  let clean_sheets = 0, over25 = 0, btts = 0;
  let formString = '';

  for (const match of matches) {
    const isHome = match.teams?.home?.id === teamId;
    const teamGoals = isHome ? (match.goals?.home ?? 0) : (match.goals?.away ?? 0);
    const oppGoals = isHome ? (match.goals?.away ?? 0) : (match.goals?.home ?? 0);
    const total = teamGoals + oppGoals;

    gf += teamGoals;
    ga += oppGoals;

    if (teamGoals > oppGoals) { wins++; formString += 'W'; }
    else if (teamGoals === oppGoals) { draws++; formString += 'D'; }
    else { losses++; formString += 'L'; }

    if (oppGoals === 0) clean_sheets++;
    if (total > 2.5) over25++;
    if (teamGoals > 0 && oppGoals > 0) btts++;
  }

  const n = matches.length;
  const points = wins * 3 + draws;

  return {
    wins,
    draws,
    losses,
    gf,
    ga,
    ppg: Math.round((points / n) * 10) / 10,
    clean_sheet_pct: Math.round((clean_sheets / n) * 100),
    over_2_5_rate: Math.round((over25 / n) * 100),
    btts_rate: Math.round((btts / n) * 100),
    form_string: formString,
  };
}

function assessInjuryImpact(injuries) {
  if (!injuries || injuries.length === 0) return 'Low';

  const criticalPositions = ['Goalkeeper'];
  const highImpact = ['Defender', 'Midfielder'];

  let score = 0;
  for (const injury of injuries) {
    const pos = injury.player?.position || '';
    if (criticalPositions.some(p => pos.includes(p))) score += 4;
    else if (highImpact.some(p => pos.includes(p))) score += 2;
    else score += 1;
  }

  if (score >= 8) return 'Critical';
  if (score >= 5) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

function buildAnalysisPrompt(matchData) {
  const { fixture, teams, h2h, homeStats, awayStats, homeForm, awayForm, injuries, odds, standings, liveData } = matchData;

  const isLive = liveData && liveData.fixture?.status?.short !== 'NS';
  const homeInjuries = injuries?.home || [];
  const awayInjuries = injuries?.away || [];

  const h2hStats = calculateH2HStats(h2h, teams.home.id);
  const homeFormStats = calculateFormStats(homeForm, teams.home.id);
  const awayFormStats = calculateFormStats(awayForm, teams.away.id);

  const homeInjuryImpact = assessInjuryImpact(homeInjuries);
  const awayInjuryImpact = assessInjuryImpact(awayInjuries);

  const prompt = `
Analyze this football match and return ONLY valid JSON.

## Match Info
- Fixture ID: ${fixture?.id}
- Match: ${teams?.home?.name} vs ${teams?.away?.name}
- League: ${fixture?.league?.name || 'Unknown League'}
- Date: ${fixture?.date || new Date().toISOString()}
- Status: ${isLive ? 'LIVE' : 'Pre-Match'}
${isLive ? `- Current Score: ${liveData?.goals?.home ?? 0} - ${liveData?.goals?.away ?? 0}` : ''}
${isLive ? `- Minute: ${liveData?.fixture?.status?.elapsed || 0}'` : ''}

## Head-to-Head (Last ${h2hStats.total_matches} matches)
- ${teams?.home?.name} wins: ${h2hStats.home_win_pct}%
- ${teams?.away?.name} wins: ${h2hStats.away_win_pct}%
- Draws: ${h2hStats.draw_pct}%
- Average goals: ${h2hStats.avg_goals}
- BTTS rate: ${h2hStats.btts_rate}%
- Over 2.5 rate: ${h2hStats.over_2_5_rate}%

## Home Team Form (Last 10 home games)
- Record: ${homeFormStats.wins}W ${homeFormStats.draws}D ${homeFormStats.losses}L
- Goals: ${homeFormStats.gf} scored, ${homeFormStats.ga} conceded
- Points per game: ${homeFormStats.ppg}
- Clean sheet %: ${homeFormStats.clean_sheet_pct}%
- Over 2.5 rate: ${homeFormStats.over_2_5_rate}%
- BTTS rate: ${homeFormStats.btts_rate}%
- Recent form: ${homeFormStats.form_string}

## Away Team Form (Last 10 away games)
- Record: ${awayFormStats.wins}W ${awayFormStats.draws}D ${awayFormStats.losses}L
- Goals: ${awayFormStats.gf} scored, ${awayFormStats.ga} conceded
- Points per game: ${awayFormStats.ppg}
- Clean sheet %: ${awayFormStats.clean_sheet_pct}%
- Over 2.5 rate: ${awayFormStats.over_2_5_rate}%
- BTTS rate: ${awayFormStats.btts_rate}%
- Recent form: ${awayFormStats.form_string}

## Team Statistics
Home - Avg goals scored: ${homeStats?.statistics?.[0]?.value ?? 'N/A'}, conceded: ${homeStats?.statistics?.[1]?.value ?? 'N/A'}
Away - Avg goals scored: ${awayStats?.statistics?.[0]?.value ?? 'N/A'}, conceded: ${awayStats?.statistics?.[1]?.value ?? 'N/A'}

## Injuries & Suspensions
Home Team (${teams?.home?.name}) - Impact: ${homeInjuryImpact}
${homeInjuries.length > 0 ? homeInjuries.slice(0, 8).map(i => `- ${i.player?.name} (${i.player?.position}): ${i.player?.reason || 'Injured'}`).join('\n') : '- No known injuries'}

Away Team (${teams?.away?.name}) - Impact: ${awayInjuryImpact}
${awayInjuries.length > 0 ? awayInjuries.slice(0, 8).map(i => `- ${i.player?.name} (${i.player?.position}): ${i.player?.reason || 'Injured'}`).join('\n') : '- No known injuries'}

## Current Odds
${odds ? `
- ${teams?.home?.name} Win: ${odds.home_win ?? 'N/A'}
- Draw: ${odds.draw ?? 'N/A'}
- ${teams?.away?.name} Win: ${odds.away_win ?? 'N/A'}
- Over 2.5: ${odds.over_2_5 ?? 'N/A'}
- Under 2.5: ${odds.under_2_5 ?? 'N/A'}
` : '- Odds not available'}

${isLive && liveData ? `
## LIVE DATA
- Possession: ${liveData?.statistics?.[0]?.statistics?.find(s => s.type === 'Ball Possession')?.value ?? 'N/A'} / ${liveData?.statistics?.[1]?.statistics?.find(s => s.type === 'Ball Possession')?.value ?? 'N/A'}
- Shots on target: ${liveData?.statistics?.[0]?.statistics?.find(s => s.type === 'Shots on Goal')?.value ?? 0} / ${liveData?.statistics?.[1]?.statistics?.find(s => s.type === 'Shots on Goal')?.value ?? 0}
- Corners: ${liveData?.statistics?.[0]?.statistics?.find(s => s.type === 'Corner Kicks')?.value ?? 0} / ${liveData?.statistics?.[1]?.statistics?.find(s => s.type === 'Corner Kicks')?.value ?? 0}
- Recent events: ${(liveData?.events || []).slice(-5).map(e => `${e.time?.elapsed}' ${e.type} - ${e.team?.name}`).join(', ')}
` : ''}

Return the analysis as this exact JSON structure:
{
  "match": "string",
  "match_date": "ISO date string",
  "league": "string",
  "analysis_type": "pre-match or live",
  "recommended_bets": [
    {
      "market": "1X2 | Over/Under | BTTS | Asian Handicap",
      "pick": "specific pick",
      "confidence": number (0-100),
      "odds": number,
      "value_rating": "Good Value | Fair | Avoid",
      "reasoning": "3-5 sentences",
      "risk_level": "Low | Medium | High"
    }
  ],
  "key_factors": ["array of 3-6 key insight strings"],
  "avoid_flags": ["array of risk/warning strings, empty if none"],
  "stats_snapshot": {
    "h2h_home_win_pct": number,
    "h2h_avg_goals": number,
    "home_form_ppg": number,
    "away_form_ppg": number,
    "home_over25_rate": number,
    "away_over25_rate": number,
    "home_btts_rate": number,
    "away_btts_rate": number,
    "injury_impact_home": "Low | Medium | High | Critical",
    "injury_impact_away": "Low | Medium | High | Critical"
  }
}
`.trim();

  return { prompt, h2hStats, homeFormStats, awayFormStats, homeInjuryImpact, awayInjuryImpact };
}

async function analyzeMatch(matchData, forceRefresh = false) {
  const fixtureId = matchData.fixture?.id;

  // Check cache (skip for live matches or if force refresh)
  const isLive = matchData.liveData && matchData.liveData.fixture?.status?.short !== 'NS';
  if (!isLive && !forceRefresh && fixtureId) {
    const cached = getAnalysis(fixtureId);
    if (cached) {
      const age = (Date.now() - (cached._cached_at || 0)) / 1000;
      if (age < 10800) return cached; // 3h cache for pre-match
    }
  }

  const { prompt } = buildAnalysisPrompt(matchData);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are an expert football betting analyst with 15 years of experience.
You analyze matches using a strict data-driven methodology.
You must return ONLY a valid JSON object, no other text, no markdown code fences.

Weighting model:
- Home/Away recent form: 30%
- H2H history: 20%
- Attack/Defense strength: 25%
- Injuries and squad: 15%
- League context and pressure: 10%

Rules:
- Never recommend a bet with confidence below 62%
- If confidence < 62%, return pick: "SKIP" with clear reason
- Always consider if odds offer real value vs implied probability
- Flag if this match has high variance (cup game, derby, relegation 6-pointer)
- For live matches: factor in current score, red cards, and momentum`,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text;

  // Parse JSON response
  let analysis;
  try {
    // Remove any potential markdown code fences
    const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    analysis = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Claude response:', content.substring(0, 200));
    throw new Error('Failed to parse AI analysis response');
  }

  analysis._cached_at = Date.now();
  analysis._fixture_id = fixtureId;

  if (fixtureId) {
    saveAnalysis(fixtureId, analysis);
  }

  return analysis;
}

module.exports = { analyzeMatch, calculateH2HStats, calculateFormStats, assessInjuryImpact };
