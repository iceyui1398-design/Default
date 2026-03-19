/**
 * claudeDataService.js
 * Uses Claude AI to generate realistic football data when external APIs are unavailable.
 * Replaces RapidAPI (fixtures/H2H/form/injuries) and The Odds API.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { saveOdds, saveH2H, saveTeamStats, saveInjuries } = require('../db/database');

const client = new Anthropic();

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
}

async function callClaude(prompt, maxTokens = 3000) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0].text;
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned);
}

async function generateFixtures(daysAhead = 3) {
  const dates = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const prompt = `Generate realistic upcoming football (soccer) fixtures for these dates: ${dates.join(', ')}.
Include 4-6 matches per day from: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, and UEFA Champions League.
Use real team names and realistic kickoff times (spread across the day).

Return ONLY a valid JSON array. Each element must match this structure exactly:
[
  {
    "fixture": {
      "id": <unique positive integer>,
      "date": "<ISO 8601 datetime with timezone, e.g. 2026-03-20T15:00:00+00:00>",
      "timestamp": <unix timestamp integer>,
      "status": {"long": "Not Started", "short": "NS", "elapsed": null},
      "venue": {"name": "<stadium name>", "city": "<city>"},
      "referee": "<referee full name>"
    },
    "league": {
      "id": <integer: Premier League=39, La Liga=140, Bundesliga=78, Serie A=135, Ligue 1=61, UCL=2>,
      "name": "<league name>",
      "country": "<country>",
      "season": 2025,
      "round": "<e.g. Regular Season - 28>"
    },
    "teams": {
      "home": {"id": <integer>, "name": "<team name>", "logo": ""},
      "away": {"id": <integer>, "name": "<team name>", "logo": ""}
    },
    "goals": {"home": null, "away": null},
    "score": {
      "halftime": {"home": null, "away": null},
      "fulltime": {"home": null, "away": null}
    }
  }
]

Fixture IDs must be unique. Team IDs must be consistent (same team always same ID). Return ONLY the JSON array.`;

  return callClaude(prompt, 4096);
}

async function generateMatchDetails(homeTeamId, homeTeamName, awayTeamId, awayTeamName, leagueName, fixtureId) {
  const prompt = `Generate realistic historical football data for: ${homeTeamName} (home) vs ${awayTeamName} (away) in ${leagueName}.

Return ONLY a valid JSON object with this exact structure:
{
  "h2h": [
    <8 past meetings, most recent first, each with this shape:
    {"fixture": {"id": <int>, "date": "<ISO date>"}, "teams": {"home": {"id": ${homeTeamId}, "name": "${homeTeamName}"}, "away": {"id": ${awayTeamId}, "name": "${awayTeamName}"}}, "goals": {"home": <int>, "away": <int>}}>
  ],
  "homeForm": [
    <8 recent matches for ${homeTeamName}, each with same shape as h2h entries>
  ],
  "awayForm": [
    <8 recent matches for ${awayTeamName}, each with same shape as h2h entries>
  ],
  "injuries": {
    "home": [
      <0-3 objects: {"player": {"name": "<name>", "position": "<Goalkeeper|Defender|Midfielder|Attacker>", "reason": "<injury type>"}}>
    ],
    "away": [
      <0-3 objects with same shape>
    ]
  },
  "odds": {
    "home_win": <decimal odds e.g. 2.10>,
    "draw": <decimal odds e.g. 3.40>,
    "away_win": <decimal odds e.g. 3.20>,
    "over_2_5": <decimal odds e.g. 1.85>,
    "under_2_5": <decimal odds e.g. 1.95>,
    "btts_yes": <decimal odds e.g. 1.80>,
    "btts_no": <decimal odds e.g. 2.00>
  }
}

Make results realistic and historically plausible. In homeForm/awayForm, the team of interest can appear as either home or away.
Ensure implied probabilities for 1X2 odds sum to roughly 105-110%.
Return ONLY the JSON object.`;

  return callClaude(prompt, 3500);
}

async function generateAndSaveMatchDetails(fixture) {
  const fixtureId = fixture.fixture?.id;
  const homeTeamId = fixture.teams?.home?.id;
  const awayTeamId = fixture.teams?.away?.id;
  const homeTeamName = fixture.teams?.home?.name;
  const awayTeamName = fixture.teams?.away?.name;
  const leagueName = fixture.league?.name || 'Football';

  if (!fixtureId || !homeTeamId || !awayTeamId) return;

  try {
    console.log(`[Claude] Generating match data for ${homeTeamName} vs ${awayTeamName}...`);
    const data = await generateMatchDetails(homeTeamId, homeTeamName, awayTeamId, awayTeamName, leagueName, fixtureId);

    const h2hKey = `${homeTeamId}_${awayTeamId}`;
    saveH2H(h2hKey, data.h2h || []);

    if (data.homeForm) {
      saveTeamStats(homeTeamId, { _form: data.homeForm, _generated: true });
    }
    if (data.awayForm) {
      saveTeamStats(awayTeamId, { _form: data.awayForm, _generated: true });
    }

    if (data.injuries) {
      saveInjuries(fixtureId, data.injuries);
    }

    if (data.odds) {
      const matchKey = `${homeTeamName}_vs_${awayTeamName}_${fixture.fixture?.date}`;
      saveOdds(matchKey, {
        raw: { home_team: homeTeamName, away_team: awayTeamName, fixture_id: fixtureId },
        parsed: data.odds,
      });
    }

    return data;
  } catch (err) {
    console.error(`[Claude] Failed to generate match details for fixture ${fixtureId}:`, err.message);
    return null;
  }
}

async function generateAndSaveFixtures(daysAhead = 3) {
  try {
    console.log('[Claude] Generating fixtures...');
    const fixtures = await generateFixtures(daysAhead);
    console.log(`[Claude] Generated ${fixtures.length} fixtures`);
    return fixtures;
  } catch (err) {
    console.error('[Claude] Failed to generate fixtures:', err.message);
    return [];
  }
}

async function generateOddsForFixtures(fixtures) {
  if (!fixtures || fixtures.length === 0) return;

  const list = fixtures.slice(0, 15).map(f =>
    `${f.teams?.home?.name} vs ${f.teams?.away?.name} (${f.league?.name})`
  ).join('\n');

  const prompt = `Generate realistic betting odds for these football matches:
${list}

Return ONLY a valid JSON array:
[
  {
    "home_team": "<exact name from list>",
    "away_team": "<exact name from list>",
    "odds": {
      "home_win": <decimal>,
      "draw": <decimal>,
      "away_win": <decimal>,
      "over_2_5": <decimal>,
      "under_2_5": <decimal>,
      "btts_yes": <decimal>,
      "btts_no": <decimal>
    }
  }
]

Implied probabilities for 1X2 must sum to 105-110%. Return ONLY the JSON array.`;

  try {
    const oddsArray = await callClaude(prompt, 2000);
    for (const entry of oddsArray) {
      const fixture = fixtures.find(f =>
        f.teams?.home?.name === entry.home_team && f.teams?.away?.name === entry.away_team
      );
      const matchKey = `${entry.home_team}_vs_${entry.away_team}_${fixture?.fixture?.date || new Date().toISOString()}`;
      saveOdds(matchKey, {
        raw: { home_team: entry.home_team, away_team: entry.away_team },
        parsed: entry.odds,
      });
    }
    console.log(`[Claude] Generated odds for ${oddsArray.length} matches`);
  } catch (err) {
    console.error('[Claude] Failed to generate odds:', err.message);
  }
}

module.exports = {
  generateAndSaveFixtures,
  generateAndSaveMatchDetails,
  generateOddsForFixtures,
};
