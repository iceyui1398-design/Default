const axios = require('axios');

const BASE_URL = 'https://api.the-odds-api.com/v4';

async function fetchOdds(sport = 'soccer_epl', regions = 'uk', markets = 'h2h,totals') {
  try {
    const response = await axios.get(`${BASE_URL}/sports/${sport}/odds`, {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions,
        markets,
        oddsFormat: 'decimal',
      },
      timeout: 15000,
    });
    return response.data || [];
  } catch (error) {
    console.error('Odds API error:', error.response?.data || error.message);
    return [];
  }
}

async function fetchSports() {
  try {
    const response = await axios.get(`${BASE_URL}/sports`, {
      params: { apiKey: process.env.ODDS_API_KEY },
      timeout: 15000,
    });
    return response.data || [];
  } catch (error) {
    console.error('Odds API sports error:', error.message);
    return [];
  }
}

// Fetch odds for multiple soccer competitions
const SOCCER_SPORTS = [
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
];

async function fetchAllSoccerOdds() {
  const allOdds = [];
  for (const sport of SOCCER_SPORTS) {
    try {
      const odds = await fetchOdds(sport);
      allOdds.push(...odds.map(o => ({ ...o, sport_key: sport })));
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      console.error(`Failed to fetch odds for ${sport}:`, e.message);
    }
  }
  return allOdds;
}

function parseOddsForMatch(oddsData) {
  if (!oddsData) return null;

  const result = {
    home_win: null,
    draw: null,
    away_win: null,
    over_2_5: null,
    under_2_5: null,
    btts_yes: null,
    btts_no: null,
  };

  for (const bookmaker of (oddsData.bookmakers || [])) {
    for (const market of (bookmaker.markets || [])) {
      if (market.key === 'h2h') {
        const outcomes = market.outcomes || [];
        for (const outcome of outcomes) {
          if (outcome.name === oddsData.home_team) result.home_win = outcome.price;
          else if (outcome.name === oddsData.away_team) result.away_win = outcome.price;
          else if (outcome.name === 'Draw') result.draw = outcome.price;
        }
      } else if (market.key === 'totals') {
        const outcomes = market.outcomes || [];
        for (const outcome of outcomes) {
          if (outcome.point === 2.5) {
            if (outcome.name === 'Over') result.over_2_5 = outcome.price;
            else if (outcome.name === 'Under') result.under_2_5 = outcome.price;
          }
        }
      }
    }
    // Use first bookmaker with data
    if (result.home_win) break;
  }

  return result;
}

module.exports = {
  fetchOdds,
  fetchSports,
  fetchAllSoccerOdds,
  parseOddsForMatch,
};
