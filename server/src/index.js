require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./db/database');
const { initializeScheduler } = require('./services/scheduler');
const fixturesRouter = require('./routes/fixtures');
const oddsRouter = require('./routes/odds');
const analysisRouter = require('./routes/analysis');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apis: {
      rapidapi: !!process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here',
      odds_api: !!process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key_here',
      anthropic: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here',
    },
  });
});

// Routes
app.use('/api/fixtures', fixturesRouter);
app.use('/api/odds', oddsRouter);
app.use('/api/analysis', analysisRouter);

// Socket.io connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`Client ${socket.id} subscribed to match ${matchId}`);
  });

  socket.on('unsubscribe_match', (matchId) => {
    socket.leave(`match_${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Initialize database and scheduler
initializeDatabase();
initializeScheduler(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Football Betting API server running on port ${PORT}`);
  console.log(`API Keys configured:`);
  console.log(`  - RapidAPI: ${process.env.RAPIDAPI_KEY ? 'YES' : 'NO'}`);
  console.log(`  - Odds API: ${process.env.ODDS_API_KEY ? 'YES' : 'NO'}`);
  console.log(`  - Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO'}`);
});

module.exports = { app, server, io };
