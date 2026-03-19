const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// GET /api/analysis - Get all analyses
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const rows = db.prepare('SELECT fixture_id, data, created_at FROM analyses ORDER BY created_at DESC LIMIT ?').all(limit);
    const analyses = rows.map(r => ({
      fixture_id: r.fixture_id,
      created_at: r.created_at,
      ...JSON.parse(r.data),
    }));
    res.json({ success: true, data: analyses, count: analyses.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analysis/stats - Get analysis statistics
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM analyses').get();
    const recent = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE created_at > ?').get(Date.now() - 86400000);

    res.json({
      success: true,
      data: {
        total_analyses: total.count,
        analyses_today: recent.count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
