# FootballIQ — AI Football Betting Analysis PWA

A full-stack, mobile-first Progressive Web App for live football betting analysis powered by AI.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS (dark theme PWA)
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (via better-sqlite3)
- **AI**: Claude claude-sonnet-4-20250514 via Anthropic SDK
- **Data**: API-Football v3 (RapidAPI) + The Odds API
- **Charts**: Recharts
- **State**: Zustand
- **Real-time**: Socket.io (live match events pushed to client)

## Setup

### 1. Clone & Install

```bash
npm run install:all
```

### 2. Configure API Keys

Copy `server/.env.example` to `server/.env` and fill in your keys:

```env
PORT=3001
RAPIDAPI_KEY=your_rapidapi_key          # https://rapidapi.com/api-sports/api/api-football
ODDS_API_KEY=your_odds_api_key          # https://the-odds-api.com
ANTHROPIC_API_KEY=your_anthropic_key    # https://console.anthropic.com
```

### 3. Run

```bash
npm run dev          # starts both server (port 3001) and client (port 5173)
npm run dev:server   # server only
npm run dev:client   # client only
```

Open http://localhost:5173

## Architecture

### Backend Polling Scheduler

| Interval | Job |
|----------|-----|
| Every 30s | Live match scores & events |
| Every 5m | Odds from The Odds API |
| Every 3h | H2H, team stats, injuries |
| Every 24h | Fixtures for next 3 days |

### AI Analysis Engine

Claude analyzes each match using this weighting model:
- Home/Away recent form: **30%**
- H2H history: **20%**
- Attack/Defense strength: **25%**
- Injuries and squad: **15%**
- League context and pressure: **10%**

Returns structured JSON with:
- Recommended bets with confidence % and value rating
- Key factors driving the analysis
- Risk flags to avoid
- Full stats snapshot

### Real-time Updates via Socket.io

Events emitted to connected clients:
- `goal_scored` — score update with match data
- `red_card` — red card event
- `live_matches_updated` — all live match states
- `odds_movement` — when odds change >10%
- `match_ended` — when a match finishes
- `fixtures_updated` — when fixture list refreshes

## PWA Features

- Installable on iOS and Android
- Offline-capable (Workbox service worker)
- Dark theme optimized for AMOLED screens
- Mobile-first layout (max-width 512px)
- Safe area padding for notched devices

## API Endpoints

```
GET  /health                    — API key status
GET  /api/fixtures              — All upcoming fixtures
GET  /api/fixtures/live         — Live matches
GET  /api/fixtures/:id          — Fixture detail (H2H, stats, injuries, odds)
POST /api/fixtures/:id/analyze  — Trigger AI analysis
GET  /api/fixtures/:id/analysis — Get cached analysis
GET  /api/odds                  — All cached odds
POST /api/odds/refresh          — Force refresh odds
GET  /api/analysis              — All analyses
```
