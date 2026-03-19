const express = require('express');
const router = express.Router();
const {
  getFixtures,
  getLiveMatches,
  getH2H,
  getTeamStats,
  getInjuries,
  getAnalysis,
} = require('../db/database');
const { fetchMatchDetails } = require('../services/scheduler');
const { analyzeMatch } = require('../services/analysisEngine');
const {
  fetchTeamLastMatches,
} = require('../services/apiFootball');
const { getAllOdds } = require('../db/database');

// GET /api/fixtures - Get all upcoming fixtures
router.get('/', (req, res) => {
  try {
    const fixtures = getFixtures();
    const now = new Date();

    const enriched = fixtures.map(f => {
      const matchDate = new Date(f.fixture?.date);
      const isUpcoming = matchDate > now;
      const isPast = matchDate < new Date(now - 3 * 60 * 60 * 1000);
      return {
        ...f,
        _meta: {
          is_upcoming: isUpcoming,
          is_past: isPast,
          has_analysis: !!getAnalysis(f.fixture?.id),
        },
      };
    });

    // Sort by date
    enriched.sort((a, b) => new Date(a.fixture?.date) - new Date(b.fixture?.date));

    res.json({ success: true, data: enriched, count: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/live - Get live matches
router.get('/live', (req, res) => {
  try {
    const liveMatches = getLiveMatches();
    res.json({ success: true, data: liveMatches, count: liveMatches.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/:id - Get single fixture with full details
router.get('/:id', async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const fixtures = getFixtures();
    const fixture = fixtures.find(f => f.fixture?.id === fixtureId);

    if (!fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;

    const h2hKey = `${homeTeamId}_${awayTeamId}`;
    const h2h = getH2H(h2hKey);
    const homeStats = getTeamStats(homeTeamId);
    const awayStats = getTeamStats(awayTeamId);
    const injuries = getInjuries(fixtureId);

    // Get odds
    const allOdds = getAllOdds();
    const oddsEntry = allOdds.find(o => {
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || '';
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || '';
      return o.match_key?.toLowerCase().includes(homeTeamName.substring(0, 5)) ||
        o.match_key?.toLowerCase().includes(awayTeamName.substring(0, 5));
    });

    const analysis = getAnalysis(fixtureId);

    res.json({
      success: true,
      data: {
        fixture,
        h2h: h2h || [],
        homeStats: homeStats || null,
        awayStats: awayStats || null,
        injuries: injuries || { home: [], away: [] },
        odds: oddsEntry?.data?.parsed || null,
        analysis: analysis || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/fixtures/:id/analyze - Trigger AI analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const forceRefresh = req.body?.force_refresh === true;

    const fixtures = getFixtures();
    const fixture = fixtures.find(f => f.fixture?.id === fixtureId);

    if (!fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY in your .env file.',
      });
    }

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;

    // Trigger background fetch of missing data
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
      await fetchMatchDetails(fixture).catch(console.error);
    }

    const h2hKey = `${homeTeamId}_${awayTeamId}`;
    const h2h = getH2H(h2hKey) || [];
    const homeStats = getTeamStats(homeTeamId);
    const awayStats = getTeamStats(awayTeamId);
    const injuries = getInjuries(fixtureId) || { home: [], away: [] };

    let homeForm = [], awayForm = [];
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
      try {
        homeForm = await fetchTeamLastMatches(homeTeamId, 10);
        awayForm = await fetchTeamLastMatches(awayTeamId, 10);
      } catch (e) {
        console.error('Failed to fetch form data:', e.message);
      }
    }

    const allOdds = getAllOdds();
    const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || '';
    const oddsEntry = allOdds.find(o =>
      o.match_key?.toLowerCase().includes(homeTeamName.substring(0, 5))
    );

    const matchData = {
      fixture: fixture.fixture,
      teams: fixture.teams,
      h2h,
      homeStats,
      awayStats,
      homeForm,
      awayForm,
      injuries,
      odds: oddsEntry?.data?.parsed || null,
      standings: null,
      liveData: null,
    };

    const analysis = await analyzeMatch(matchData, forceRefresh);

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/:id/analysis - Get existing analysis
router.get('/:id/analysis', (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const analysis = getAnalysis(fixtureId);

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'No analysis found for this fixture' });
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
