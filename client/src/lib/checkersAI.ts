import type { Board, Difficulty, Move, PlayerSide } from './checkersTypes';
import { getAllMoves, applyMove } from './checkersEngine';

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const baseVal = p.isKing ? 3 : 1;
      const centerBonus = (3.5 - Math.abs(c - 3.5)) * 0.04;
      if (p.player === 'player2') {
        score += baseVal + centerBonus + (p.isKing ? 0 : (r / 7) * 0.3);
      } else {
        score -= baseVal + centerBonus + (p.isKing ? 0 : ((7 - r) / 7) * 0.3);
      }
    }
  }
  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMax: boolean,
  mandatoryJump: boolean,
): number {
  if (depth === 0) return evaluate(board);

  const player: PlayerSide = isMax ? 'player2' : 'player1';
  const moves = getAllMoves(board, player, mandatoryJump);

  if (moves.length === 0) return isMax ? -9999 : 9999;

  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(
        best,
        minimax(applyMove(board, m), depth - 1, alpha, beta, false, mandatoryJump),
      );
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      best = Math.min(
        best,
        minimax(applyMove(board, m), depth - 1, alpha, beta, true, mandatoryJump),
      );
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBotMove(
  board: Board,
  difficulty: Difficulty,
  mandatoryJump: boolean,
): Move | null {
  const moves = getAllMoves(board, 'player2', mandatoryJump);
  if (!moves.length) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 'medium' ? 4 : 6;
  // Shuffle for variety at equal scores
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  let best = shuffled[0];
  let bestScore = -Infinity;

  for (const m of shuffled) {
    const s = minimax(
      applyMove(board, m),
      depth - 1,
      -Infinity,
      Infinity,
      false,
      mandatoryJump,
    );
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }

  return best;
}
