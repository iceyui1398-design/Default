const cron = require('node-cron');
const {
  fetchLiveMatches,
  fetchFixtures,
  fetchH2H,
  fetchTeamStatistics,
  fetchTeamLastMatches,
  fetchInjuries,
  fetchFixtureStats,
} = require('./apiFootball');
const { fetchAllSoccerOdds, parseOddsForMatch } = require('./oddsApi');
const {
  generateAndSaveFixtures,
  generateAndSaveMatchDetails,
  generateOddsForFixtures,
} = require('./claudeDataService');
const {
  saveFixtures,
  getFixtures,
  saveLiveMatch,
  getLiveMatches,
  saveOdds,
  getAllOdds,
  saveH2H,
  getH2H,
  saveTeamStats,
  getTeamStats,
  saveInjuries,
  getInjuries,
} = require('../db/database');

let io = null;
let previousLiveData = {};
let isInitialized = false;

function setSocketIO(socketIO) {
  io = socketIO;
}

function emitLiveUpdate(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

async function pollLiveMatches() {
  if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    return;
  }

  try {
    const liveMatches = await fetchLiveMatches();

    for (const match of liveMatches) {
      const matchId = match.fixture?.id;
      if (!matchId) continue;

      const prev = previousLiveData[matchId];
      const prevScore = prev ? `${prev.goals?.home}-${prev.goals?.away}` : null;
      const currScore = `${match.goals?.home}-${match.goals?.away}`;

      saveLiveMatch(match);

      // Detect significant changes
      const changes = [];

      if (prevScore && prevScore !== currScore) {
        changes.push({ type: 'goal', data: match });
        emitLiveUpdate('goal_scored', {
          matchId,
          homeTeam: match.teams?.home?.name,
          awayTeam: match.teams?.away?.name,
          score: currScore,
          match,
        });
      }

      // Check for red cards
      const prevEvents = prev?.events?.length || 0;
      const currEvents = match.events?.length || 0;
      if (currEvents > prevEvents) {
        const newEvents = (match.events || []).slice(prevEvents);
        for (const event of newEvents) {
          if (event.type === 'Card' && event.detail === 'Red Card') {
            emitLiveUpdate('red_card', { matchId, event, match });
          }
        }
      }

      previousLiveData[matchId] = match;
    }

    // Emit all live matches update
    emitLiveUpdate('live_matches_updated', liveMatches);

    // Clean up matches that are no longer live
    const liveIds = new Set(liveMatches.map(m => m.fixture?.id));
    for (const id of Object.keys(previousLiveData)) {
      if (!liveIds.has(parseInt(id))) {
        delete previousLiveData[id];
        emitLiveUpdate('match_ended', { matchId: parseInt(id) });
      }
    }
  } catch (error) {
    console.error('Error polling live matches:', error.message);
  }
}

async function pollOdds() {
  const hasOddsApi = process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key_here';

  if (!hasOddsApi) {
    // Use Claude to generate odds for current fixtures
    const fixtures = getFixtures();
    const upcoming = fixtures.filter(f => {
      const matchDate = new Date(f.fixture?.date);
      return matchDate > new Date();
    });
    if (upcoming.length > 0) {
      await generateOddsForFixtures(upcoming);
      emitLiveUpdate('odds_updated', { count: upcoming.length, timestamp: new Date().toISOString() });
    }
    return;
  }

  try {
    const allOdds = await fetchAllSoccerOdds();
    const previousOdds = getAllOdds();
    const prevOddsMap = {};
    for (const o of previousOdds) {
      prevOddsMap[o.match_key] = o.data;
    }

    for (const oddsGame of allOdds) {
      const matchKey = `${oddsGame.home_team}_vs_${oddsGame.away_team}_${oddsGame.commence_time}`;
      const parsedOdds = parseOddsForMatch(oddsGame);

      const prevOdds = prevOddsMap[matchKey];
      if (prevOdds && parsedOdds) {
        // Check for significant odds movement (>10%)
        if (parsedOdds.home_win && prevOdds.home_win) {
          const change = Math.abs(parsedOdds.home_win - prevOdds.home_win) / prevOdds.home_win;
          if (change > 0.1) {
            emitLiveUpdate('odds_movement', {
              matchKey,
              homeTeam: oddsGame.home_team,
              awayTeam: oddsGame.away_team,
              market: '1X2',
              oldOdds: prevOdds,
              newOdds: parsedOdds,
              changePercent: Math.round(change * 100),
            });
          }
        }
      }

      saveOdds(matchKey, { raw: oddsGame, parsed: parsedOdds });
    }

    emitLiveUpdate('odds_updated', { count: allOdds.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error polling odds:', error.message);
  }
}

async function fetchFixturesJob() {
  const hasRapidApi = process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here';

  if (!hasRapidApi) {
    // Use Claude to generate fixtures
    const fixtures = await generateAndSaveFixtures(3);
    if (fixtures.length > 0) {
      saveFixtures(fixtures);
      emitLiveUpdate('fixtures_updated', { count: fixtures.length });
    }
    return;
  }

  try {
    const fixtures = await fetchFixtures(3);
    if (fixtures.length > 0) {
      saveFixtures(fixtures);
      console.log(`Fetched and cached ${fixtures.length} fixtures`);
      emitLiveUpdate('fixtures_updated', { count: fixtures.length });
    }
  } catch (error) {
    console.error('Error fetching fixtures:', error.message);
  }
}

async function fetchMatchDetails(fixture) {
  const hasRapidApi = process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here';

  if (!hasRapidApi) {
    // Use Claude to generate H2H, form, injuries, and odds
    await generateAndSaveMatchDetails(fixture);
    return;
  }

  const fixtureId = fixture.fixture?.id;
  const homeTeamId = fixture.teams?.home?.id;
  const awayTeamId = fixture.teams?.away?.id;
  const leagueId = fixture.league?.id;
  const season = fixture.league?.season;

  if (!fixtureId || !homeTeamId || !awayTeamId) return;

  try {
    // Fetch H2H if not cached
    const h2hKey = `${homeTeamId}_${awayTeamId}`;
    if (!getH2H(h2hKey)) {
      const h2h = await fetchH2H(homeTeamId, awayTeamId);
      saveH2H(h2hKey, h2h);
      await new Promise(r => setTimeout(r, 300));
    }

    // Fetch team stats if not cached
    if (!getTeamStats(homeTeamId) && leagueId) {
      const stats = await fetchTeamStatistics(homeTeamId, leagueId, season);
      if (stats) saveTeamStats(homeTeamId, stats);
      await new Promise(r => setTimeout(r, 300));
    }

    if (!getTeamStats(awayTeamId) && leagueId) {
      const stats = await fetchTeamStatistics(awayTeamId, leagueId, season);
      if (stats) saveTeamStats(awayTeamId, stats);
      await new Promise(r => setTimeout(r, 300));
    }

    // Fetch injuries if not cached
    if (!getInjuries(fixtureId)) {
      const injuries = await fetchInjuries(fixtureId);
      const grouped = {
        home: injuries.filter(i => i.team?.id === homeTeamId),
        away: injuries.filter(i => i.team?.id === awayTeamId),
      };
      saveInjuries(fixtureId, grouped);
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (error) {
    console.error(`Error fetching match details for fixture ${fixtureId}:`, error.message);
  }
}

async function fetchTeamDetailsJob() {
  if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    return;
  }

  const fixtures = getFixtures();
  const upcoming = fixtures.filter(f => {
    const matchDate = new Date(f.fixture?.date);
    const now = new Date();
    const diff = matchDate - now;
    return diff > 0 && diff < 72 * 60 * 60 * 1000; // next 72 hours
  });

  for (const fixture of upcoming.slice(0, 10)) { // limit to avoid rate limiting
    await fetchMatchDetails(fixture);
    await new Promise(r => setTimeout(r, 500));
  }
}

function initializeScheduler(socketIO) {
  io = socketIO;

  if (isInitialized) return;
  isInitialized = true;

  console.log('Initializing scheduler...');

  // Every 30 seconds: live match data
  cron.schedule('*/30 * * * * *', async () => {
    await pollLiveMatches();
  });

  // Every 5 minutes: odds
  cron.schedule('*/5 * * * *', async () => {
    await pollOdds();
  });

  // Every 3 hours: team stats, H2H, injuries
  cron.schedule('0 */3 * * *', async () => {
    await fetchTeamDetailsJob();
  });

  // Every 24 hours: fixtures
  cron.schedule('0 6 * * *', async () => {
    await fetchFixturesJob();
  });

  // Initial fetch on startup (with delay to let server start)
  setTimeout(async () => {
    await fetchFixturesJob();
    await new Promise(r => setTimeout(r, 2000));
    await pollOdds();
    await new Promise(r => setTimeout(r, 2000));
    await fetchTeamDetailsJob();
    await new Promise(r => setTimeout(r, 2000));
    await pollLiveMatches();
  }, 3000);
}

module.exports = {
  initializeScheduler,
  setSocketIO,
  pollLiveMatches,
  pollOdds,
  fetchFixturesJob,
  fetchTeamDetailsJob,
  fetchMatchDetails,
};
