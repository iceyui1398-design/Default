const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/football.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      ttl INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixtures (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_matches (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS odds (
      match_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fixture_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(fixture_id)
    );

    CREATE TABLE IF NOT EXISTS h2h (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_stats (
      team_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS injuries (
      fixture_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  console.log('Database initialized');
}

function getCached(key, ttlSeconds) {
  const row = db.prepare('SELECT data, created_at, ttl FROM cache WHERE key = ?').get(key);
  if (!row) return null;
  const age = (Date.now() - row.created_at) / 1000;
  if (age > (ttlSeconds || row.ttl)) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

function setCache(key, data, ttlSeconds) {
  db.prepare(`
    INSERT OR REPLACE INTO cache (key, data, created_at, ttl)
    VALUES (?, ?, ?, ?)
  `).run(key, JSON.stringify(data), Date.now(), ttlSeconds);
}

function saveFixtures(fixtures) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO fixtures (id, data, updated_at)
    VALUES (?, ?, ?)
  `);
  const insertMany = db.transaction((items) => {
    for (const f of items) {
      stmt.run(f.fixture.id, JSON.stringify(f), Date.now());
    }
  });
  insertMany(fixtures);
}

function getFixtures() {
  return db.prepare('SELECT data FROM fixtures ORDER BY rowid').all()
    .map(r => JSON.parse(r.data));
}

function saveLiveMatch(match) {
  db.prepare(`
    INSERT OR REPLACE INTO live_matches (id, data, updated_at)
    VALUES (?, ?, ?)
  `).run(match.fixture.id, JSON.stringify(match), Date.now());
}

function getLiveMatches() {
  return db.prepare('SELECT data FROM live_matches ORDER BY rowid').all()
    .map(r => JSON.parse(r.data));
}

function saveOdds(matchKey, oddsData) {
  db.prepare(`
    INSERT OR REPLACE INTO odds (match_key, data, updated_at)
    VALUES (?, ?, ?)
  `).run(matchKey, JSON.stringify(oddsData), Date.now());
}

function getOdds(matchKey) {
  const row = db.prepare('SELECT data, updated_at FROM odds WHERE match_key = ?').get(matchKey);
  if (!row) return null;
  return { data: JSON.parse(row.data), updated_at: row.updated_at };
}

function getAllOdds() {
  return db.prepare('SELECT match_key, data, updated_at FROM odds').all()
    .map(r => ({ match_key: r.match_key, data: JSON.parse(r.data), updated_at: r.updated_at }));
}

function saveAnalysis(fixtureId, analysis) {
  db.prepare(`
    INSERT OR REPLACE INTO analyses (fixture_id, data, created_at)
    VALUES (?, ?, ?)
  `).run(String(fixtureId), JSON.stringify(analysis), Date.now());
}

function getAnalysis(fixtureId) {
  const row = db.prepare('SELECT data FROM analyses WHERE fixture_id = ?').get(String(fixtureId));
  if (!row) return null;
  return JSON.parse(row.data);
}

function saveH2H(key, data) {
  db.prepare(`
    INSERT OR REPLACE INTO h2h (key, data, updated_at)
    VALUES (?, ?, ?)
  `).run(key, JSON.stringify(data), Date.now());
}

function getH2H(key) {
  const row = db.prepare('SELECT data, updated_at FROM h2h WHERE key = ?').get(key);
  if (!row) return null;
  const age = (Date.now() - row.updated_at) / 1000;
  if (age > 10800) return null; // 3h TTL
  return JSON.parse(row.data);
}

function saveTeamStats(teamId, data) {
  db.prepare(`
    INSERT OR REPLACE INTO team_stats (team_id, data, updated_at)
    VALUES (?, ?, ?)
  `).run(String(teamId), JSON.stringify(data), Date.now());
}

function getTeamStats(teamId) {
  const row = db.prepare('SELECT data, updated_at FROM team_stats WHERE team_id = ?').get(String(teamId));
  if (!row) return null;
  const age = (Date.now() - row.updated_at) / 1000;
  if (age > 10800) return null;
  return JSON.parse(row.data);
}

function saveInjuries(fixtureId, data) {
  db.prepare(`
    INSERT OR REPLACE INTO injuries (fixture_id, data, updated_at)
    VALUES (?, ?, ?)
  `).run(String(fixtureId), JSON.stringify(data), Date.now());
}

function getInjuries(fixtureId) {
  const row = db.prepare('SELECT data, updated_at FROM injuries WHERE fixture_id = ?').get(String(fixtureId));
  if (!row) return null;
  const age = (Date.now() - row.updated_at) / 1000;
  if (age > 10800) return null;
  return JSON.parse(row.data);
}

module.exports = {
  db,
  initializeDatabase,
  getCached,
  setCache,
  saveFixtures,
  getFixtures,
  saveLiveMatch,
  getLiveMatches,
  saveOdds,
  getOdds,
  getAllOdds,
  saveAnalysis,
  getAnalysis,
  saveH2H,
  getH2H,
  saveTeamStats,
  getTeamStats,
  saveInjuries,
  getInjuries,
};
