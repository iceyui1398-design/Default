/**
 * Pure JS database using JSON files.
 * Drop-in replacement for better-sqlite3 — works on iSH and anywhere else.
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Simple in-memory store backed by per-table JSON files
const TABLES = ['cache', 'fixtures', 'live_matches', 'odds', 'analyses', 'h2h', 'team_stats', 'injuries'];
const store = {};

function filePath(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function loadTable(table) {
  try {
    const raw = fs.readFileSync(filePath(table), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveTable(table) {
  fs.writeFileSync(filePath(table), JSON.stringify(store[table]), 'utf8');
}

function initializeDatabase() {
  for (const t of TABLES) {
    store[t] = loadTable(t);
  }
  console.log('Database initialized (JSON storage)');
}

// ── Cache ────────────────────────────────────────────────────────────────────

function getCached(key, ttlSeconds) {
  const row = store.cache[key];
  if (!row) return null;
  const age = (Date.now() - row.created_at) / 1000;
  if (age > (ttlSeconds || row.ttl)) return null;
  return row.data;
}

function setCache(key, data, ttlSeconds) {
  store.cache[key] = { data, created_at: Date.now(), ttl: ttlSeconds };
  saveTable('cache');
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

function saveFixtures(fixtures) {
  for (const f of fixtures) {
    store.fixtures[f.fixture.id] = { data: f, updated_at: Date.now() };
  }
  saveTable('fixtures');
}

function getFixtures() {
  return Object.values(store.fixtures).map(r => r.data);
}

// ── Live matches ──────────────────────────────────────────────────────────────

function saveLiveMatch(match) {
  store.live_matches[match.fixture.id] = { data: match, updated_at: Date.now() };
  saveTable('live_matches');
}

function getLiveMatches() {
  return Object.values(store.live_matches).map(r => r.data);
}

// ── Odds ──────────────────────────────────────────────────────────────────────

function saveOdds(matchKey, oddsData) {
  store.odds[matchKey] = { data: oddsData, updated_at: Date.now() };
  saveTable('odds');
}

function getOdds(matchKey) {
  const row = store.odds[matchKey];
  if (!row) return null;
  return { data: row.data, updated_at: row.updated_at };
}

function getAllOdds() {
  return Object.entries(store.odds).map(([match_key, r]) => ({
    match_key,
    data: r.data,
    updated_at: r.updated_at,
  }));
}

// ── Analyses ──────────────────────────────────────────────────────────────────

function saveAnalysis(fixtureId, analysis) {
  store.analyses[String(fixtureId)] = { data: analysis, created_at: Date.now() };
  saveTable('analyses');
}

function getAnalysis(fixtureId) {
  const row = store.analyses[String(fixtureId)];
  return row ? row.data : null;
}

// ── H2H ───────────────────────────────────────────────────────────────────────

function saveH2H(key, data) {
  store.h2h[key] = { data, updated_at: Date.now() };
  saveTable('h2h');
}

function getH2H(key) {
  const row = store.h2h[key];
  if (!row) return null;
  if ((Date.now() - row.updated_at) / 1000 > 10800) return null;
  return row.data;
}

// ── Team stats ────────────────────────────────────────────────────────────────

function saveTeamStats(teamId, data) {
  store.team_stats[String(teamId)] = { data, updated_at: Date.now() };
  saveTable('team_stats');
}

function getTeamStats(teamId) {
  const row = store.team_stats[String(teamId)];
  if (!row) return null;
  if ((Date.now() - row.updated_at) / 1000 > 10800) return null;
  return row.data;
}

// ── Injuries ──────────────────────────────────────────────────────────────────

function saveInjuries(fixtureId, data) {
  store.injuries[String(fixtureId)] = { data, updated_at: Date.now() };
  saveTable('injuries');
}

function getInjuries(fixtureId) {
  const row = store.injuries[String(fixtureId)];
  if (!row) return null;
  if ((Date.now() - row.updated_at) / 1000 > 10800) return null;
  return row.data;
}

module.exports = {
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
