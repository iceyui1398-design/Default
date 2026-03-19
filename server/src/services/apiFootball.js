const axios = require('axios');

const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

function getHeaders() {
  return {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
  };
}

async function apiRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      params,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`API-Football error [${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}

async function fetchLiveMatches() {
  const data = await apiRequest('/fixtures', { live: 'all' });
  return data.response || [];
}

async function fetchFixtures(daysAhead = 3) {
  const results = [];
  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const data = await apiRequest('/fixtures', { date: dateStr, timezone: 'UTC' });
      results.push(...(data.response || []));
    } catch (e) {
      console.error(`Failed to fetch fixtures for ${dateStr}:`, e.message);
    }
  }
  return results;
}

async function fetchH2H(team1Id, team2Id) {
  const data = await apiRequest('/fixtures/headtohead', {
    h2h: `${team1Id}-${team2Id}`,
    last: 10,
  });
  return data.response || [];
}

async function fetchTeamStatistics(teamId, leagueId, season) {
  const data = await apiRequest('/teams/statistics', {
    team: teamId,
    league: leagueId,
    season: season || new Date().getFullYear(),
  });
  return data.response || null;
}

async function fetchTeamLastMatches(teamId, last = 10) {
  const data = await apiRequest('/fixtures', {
    team: teamId,
    last,
    status: 'FT-AET-PEN',
  });
  return data.response || [];
}

async function fetchInjuries(fixtureId) {
  const data = await apiRequest('/injuries', { fixture: fixtureId });
  return data.response || [];
}

async function fetchLineups(fixtureId) {
  const data = await apiRequest('/fixtures/lineups', { fixture: fixtureId });
  return data.response || [];
}

async function fetchFixtureEvents(fixtureId) {
  const data = await apiRequest('/fixtures/events', { fixture: fixtureId });
  return data.response || [];
}

async function fetchFixtureStats(fixtureId) {
  const data = await apiRequest('/fixtures/statistics', { fixture: fixtureId });
  return data.response || [];
}

async function fetchStandings(leagueId, season) {
  const data = await apiRequest('/standings', {
    league: leagueId,
    season: season || new Date().getFullYear(),
  });
  return data.response || [];
}

async function fetchRefereeStats(refereeId) {
  // API-Football doesn't have a direct referee stats endpoint in v3
  // We approximate by returning the referee info from the fixture
  return null;
}

module.exports = {
  fetchLiveMatches,
  fetchFixtures,
  fetchH2H,
  fetchTeamStatistics,
  fetchTeamLastMatches,
  fetchInjuries,
  fetchLineups,
  fetchFixtureEvents,
  fetchFixtureStats,
  fetchStandings,
  fetchRefereeStats,
};
