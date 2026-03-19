const express = require('express');
const router = express.Router();
const { getAllOdds, saveOdds, getFixtures } = require('../db/database');
const { fetchAllSoccerOdds, parseOddsForMatch } = require('../services/oddsApi');
const { generateOddsForFixtures } = require('../services/claudeDataService');

// GET /api/odds - Get all cached odds
router.get('/', (req, res) => {
  try {
    const allOdds = getAllOdds();
    res.json({ success: true, data: allOdds, count: allOdds.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/odds/refresh - Force refresh odds
router.post('/refresh', async (req, res) => {
  try {
    const hasOddsApi = process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key_here';

    if (!hasOddsApi) {
      // Use Claude to generate odds for upcoming fixtures
      const fixtures = getFixtures().filter(f => new Date(f.fixture?.date) > new Date());
      await generateOddsForFixtures(fixtures);
      return res.json({ success: true, message: `Generated odds for ${fixtures.length} upcoming matches using AI` });
    }

    const allOdds = await fetchAllSoccerOdds();
    for (const oddsGame of allOdds) {
      const matchKey = `${oddsGame.home_team}_vs_${oddsGame.away_team}_${oddsGame.commence_time}`;
      const parsedOdds = parseOddsForMatch(oddsGame);
      saveOdds(matchKey, { raw: oddsGame, parsed: parsedOdds });
    }

    res.json({ success: true, message: `Refreshed ${allOdds.length} matches with odds` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
