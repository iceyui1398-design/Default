import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Board,
  Difficulty,
  GameMode,
  HistoryEntry,
  Move,
  PlayerSide,
  Position,
  Settings,
} from '../lib/checkersTypes';
import {
  createInitialBoard,
  getMovesForPiece,
  applyMove,
  countPieces,
  checkWinner,
} from '../lib/checkersEngine';
import { getBotMove } from '../lib/checkersAI';
import CheckerBoard from '../components/CheckerBoard';
import SettingsModal from '../components/SettingsModal';

interface Props {
  difficulty: Difficulty;
  gameMode: GameMode;
  settings: Settings;
  onBack: () => void;
  onSettingsChange: (s: Settings) => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: '#2ECC71',
  medium: '#F39C12',
  hard: '#E74C3C',
};

const GameScreen: React.FC<Props> = ({
  difficulty,
  gameMode,
  settings,
  onBack,
  onSettingsChange,
}) => {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSide>('player1');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [winner, setWinner] = useState<PlayerSide | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(true);

  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { p1: p1Count, p2: p2Count } = countPieces(board);

  // Show turn banner briefly
  useEffect(() => {
    setShowTurnBanner(true);
    const t = setTimeout(() => setShowTurnBanner(false), 1800);
    return () => clearTimeout(t);
  }, [currentPlayer]);

  // Bot move
  useEffect(() => {
    if (winner) return;
    if (gameMode !== 'bot' || currentPlayer !== 'player2') return;

    setBotThinking(true);
    const delay = difficulty === 'hard' ? 900 : difficulty === 'medium' ? 650 : 450;

    botTimerRef.current = setTimeout(() => {
      const move = getBotMove(board, difficulty, settings.mandatoryJump);
      if (move) {
        setHistory(prev => [...prev, { board, p1Count, p2Count }]);
        const nb = applyMove(board, move);
        setBoard(nb);
        setLastMove(move);

        const w = checkWinner(nb, 'player1', settings.mandatoryJump);
        if (w) {
          setWinner(w);
        } else {
          setCurrentPlayer('player1');
        }
      } else {
        setWinner('player1');
      }
      setBotThinking(false);
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [currentPlayer, board, gameMode, difficulty, settings.mandatoryJump, winner]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (winner || botThinking) return;
      if (gameMode === 'bot' && currentPlayer !== 'player1') return;

      const cell = board[row][col];

      // Click on valid move destination
      if (
        selectedPos &&
        validMoves.some(m => m.to.row === row && m.to.col === col)
      ) {
        const move = validMoves.find(m => m.to.row === row && m.to.col === col)!;

        setHistory(prev => [...prev, { board, p1Count, p2Count }]);
        const nb = applyMove(board, move);
        setBoard(nb);
        setLastMove(move);
        setSelectedPos(null);
        setValidMoves([]);

        const nextPlayer: PlayerSide =
          currentPlayer === 'player1' ? 'player2' : 'player1';
        const w = checkWinner(nb, nextPlayer, settings.mandatoryJump);
        if (w) {
          setWinner(w);
        } else {
          setCurrentPlayer(nextPlayer);
        }
        return;
      }

      // Click on own piece
      if (cell && cell.player === currentPlayer) {
        const moves = getMovesForPiece(
          board,
          { row, col },
          currentPlayer,
          settings.mandatoryJump,
        );
        setSelectedPos({ row, col });
        setValidMoves(moves);
        return;
      }

      // Deselect
      setSelectedPos(null);
      setValidMoves([]);
    },
    [
      board,
      currentPlayer,
      selectedPos,
      validMoves,
      gameMode,
      settings.mandatoryJump,
      winner,
      botThinking,
      p1Count,
      p2Count,
    ],
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setBotThinking(false);

    const entry = history[history.length - 1];
    setBoard(entry.board);
    setHistory(prev => prev.slice(0, -1));
    setCurrentPlayer('player1');
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setWinner(null);
  };

  const handleRestart = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setBotThinking(false);
    setBoard(createInitialBoard());
    setCurrentPlayer('player1');
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setHistory([]);
    setWinner(null);
  };

  const diffColor = DIFF_COLORS[difficulty];

  const turnLabel =
    gameMode === 'friend'
      ? currentPlayer === 'player1'
        ? 'Player 1 turn'
        : 'Player 2 turn'
      : currentPlayer === 'player1'
        ? 'Your turn'
        : 'Bot thinking...';

  return (
    <div className="screen game-screen">
      {/* Top bar */}
      <div className="game-topbar">
        <button className="nav-btn" onClick={onBack}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        {/* Score bar */}
        <div className="score-bar">
          <div className="score-side score-you">
            <div className="score-name">
              {gameMode === 'friend' ? 'P1' : 'YOU'}
            </div>
            <div className="score-number">{p1Count}</div>
          </div>
          <div className="score-center">
            <div className="score-diff-label" style={{ color: diffColor }}>
              {DIFF_LABELS[difficulty]}
            </div>
            <div className="score-vs">VS</div>
          </div>
          <div className="score-side score-bot">
            <div className="score-name">{gameMode === 'friend' ? 'P2' : 'BOT'}</div>
            <div className="score-number">{p2Count}</div>
          </div>
        </div>

        <button className="nav-btn" onClick={handleRestart}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1,4 1,10 7,10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
        </button>
      </div>

      {/* Board area */}
      <div className="board-area">
        <CheckerBoard
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          lastMove={lastMove}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Bottom area */}
      <div className="game-bottom">
        {/* Turn indicator */}
        {!winner && (
          <div className={`turn-indicator ${showTurnBanner ? 'turn-visible' : 'turn-faded'}`}>
            <div className="turn-circle">
              <span className="turn-text">{turnLabel}</span>
              {botThinking && (
                <div className="bot-dots">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Undo button */}
        <button
          className={`undo-btn ${history.length === 0 ? 'undo-disabled' : ''}`}
          onClick={handleUndo}
          disabled={history.length === 0}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9,14 4,9 9,4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          {history.length > 0 && (
            <span className="undo-badge">{history.length}</span>
          )}
          <span className="undo-label">Undo</span>
        </button>
      </div>

      {/* Winner overlay */}
      {winner && (
        <div className="winner-overlay" onClick={handleRestart}>
          <div className="winner-card">
            <div className="winner-emoji">
              {winner === 'player1' ? '🎉' : gameMode === 'friend' ? '🎉' : '🤖'}
            </div>
            <h2 className="winner-title">
              {winner === 'player1'
                ? gameMode === 'friend'
                  ? 'Player 1 Wins!'
                  : 'You Win!'
                : gameMode === 'friend'
                  ? 'Player 2 Wins!'
                  : 'Bot Wins!'}
            </h2>
            <p className="winner-sub">Tap to play again</p>
            <button
              className="play-again-btn"
              style={{ background: diffColor }}
              onClick={handleRestart}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default GameScreen;
