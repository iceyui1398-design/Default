import type { Board, Move, PlayerSide, Position } from './checkersTypes';

let _id = 0;
const genId = () => `p${++_id}`;

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  // player2 (dark) at rows 0-2
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { id: genId(), player: 'player2', isKing: false };
      }
    }
  }

  // player1 (white) at rows 5-7
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { id: genId(), player: 'player1', isKing: false };
      }
    }
  }

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function getDirs(player: PlayerSide, isKing: boolean): [number, number][] {
  if (isKing) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return player === 'player1' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function findJumps(
  board: Board,
  pos: Position,
  player: PlayerSide,
  isKing: boolean,
  captured: Position[],
): Move[] {
  const dirs = getDirs(player, isKing);
  const result: Move[] = [];

  for (const [dr, dc] of dirs) {
    const mr = pos.row + dr;
    const mc = pos.col + dc;
    const tr = pos.row + 2 * dr;
    const tc = pos.col + 2 * dc;

    if (!inBounds(mr, mc) || !inBounds(tr, tc)) continue;
    const enemy = board[mr][mc];
    if (!enemy || enemy.player === player) continue;
    if (board[tr][tc] !== null) continue;
    if (captured.some(c => c.row === mr && c.col === mc)) continue;

    const nowCaptured = [...captured, { row: mr, col: mc }];
    const newPos = { row: tr, col: tc };

    // Would this promote mid-jump?
    const promoted =
      !isKing &&
      ((player === 'player1' && tr === 0) || (player === 'player2' && tr === 7));

    const chains = findJumps(board, newPos, player, isKing || promoted, nowCaptured);

    if (chains.length === 0) {
      result.push({
        from: { row: pos.row, col: pos.col },
        to: newPos,
        captures: nowCaptured,
      });
    } else {
      result.push(...chains);
    }
  }

  return result;
}

export function getAllMoves(
  board: Board,
  player: PlayerSide,
  mandatoryJump: boolean,
): Move[] {
  const simples: Move[] = [];
  const jumps: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;

      const pos = { row: r, col: c };

      for (const [dr, dc] of getDirs(player, piece.isKing)) {
        const tr = r + dr;
        const tc = c + dc;
        if (inBounds(tr, tc) && !board[tr][tc]) {
          simples.push({ from: pos, to: { row: tr, col: tc }, captures: [] });
        }
      }

      jumps.push(...findJumps(board, pos, player, piece.isKing, []));
    }
  }

  return mandatoryJump && jumps.length > 0 ? jumps : [...jumps, ...simples];
}

export function getMovesForPiece(
  board: Board,
  pos: Position,
  player: PlayerSide,
  mandatoryJump: boolean,
): Move[] {
  return getAllMoves(board, player, mandatoryJump).filter(
    m => m.from.row === pos.row && m.from.col === pos.col,
  );
}

export function applyMove(board: Board, move: Move): Board {
  const nb = cloneBoard(board);
  const piece = nb[move.from.row][move.from.col]!;

  move.captures.forEach(({ row, col }) => {
    nb[row][col] = null;
  });

  nb[move.to.row][move.to.col] = {
    ...piece,
    isKing:
      piece.isKing ||
      (piece.player === 'player1' && move.to.row === 0) ||
      (piece.player === 'player2' && move.to.row === 7),
  };
  nb[move.from.row][move.from.col] = null;

  return nb;
}

export function countPieces(board: Board): { p1: number; p2: number } {
  let p1 = 0,
    p2 = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.player === 'player1') p1++;
      if (board[r][c]?.player === 'player2') p2++;
    }
  return { p1, p2 };
}

export function checkWinner(
  board: Board,
  nextPlayer: PlayerSide,
  mandatoryJump: boolean,
): PlayerSide | null {
  const { p1, p2 } = countPieces(board);
  if (p1 === 0) return 'player2';
  if (p2 === 0) return 'player1';
  if (getAllMoves(board, nextPlayer, mandatoryJump).length === 0) {
    return nextPlayer === 'player1' ? 'player2' : 'player1';
  }
  return null;
}
