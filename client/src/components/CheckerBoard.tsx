import React from 'react';
import type { Board, Move, Position } from '../lib/checkersTypes';

interface Props {
  board: Board;
  selectedPos: Position | null;
  validMoves: Move[];
  lastMove: Move | null;
  onCellClick: (row: number, col: number) => void;
  flipped?: boolean;
}

const BOARD_SIZE = 8;

const CheckerBoard: React.FC<Props> = ({
  board,
  selectedPos,
  validMoves,
  lastMove,
  onCellClick,
  flipped = false,
}) => {
  const validDests = new Set(validMoves.map(m => `${m.to.row},${m.to.col}`));
  const isLastMoveCell = (r: number, c: number) =>
    lastMove &&
    ((lastMove.from.row === r && lastMove.from.col === c) ||
      (lastMove.to.row === r && lastMove.to.col === c));

  const rows = flipped
    ? Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i)
    : Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const cols = flipped
    ? Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i)
    : Array.from({ length: BOARD_SIZE }, (_, i) => i);

  return (
    <div className="checker-board-container">
      <div className="checker-board">
        {rows.map(r =>
          cols.map(c => {
            const isDark = (r + c) % 2 === 1;
            const piece = board[r][c];
            const isSelected = selectedPos?.row === r && selectedPos?.col === c;
            const isValidDest = validDests.has(`${r},${c}`);
            const isLast = isLastMoveCell(r, c);

            return (
              <div
                key={`${r}-${c}`}
                className={`checker-cell ${isDark ? 'cell-dark' : 'cell-light'} ${isLast && isDark ? 'cell-last-move' : ''}`}
                onClick={() => isDark && onCellClick(r, c)}
              >
                {/* Valid move indicator (empty cell) */}
                {isDark && isValidDest && !piece && (
                  <div className="valid-move-dot" />
                )}

                {/* Piece */}
                {piece && (
                  <div
                    className={`checker-piece ${
                      piece.player === 'player1' ? 'piece-white' : 'piece-dark'
                    } ${isSelected ? 'piece-selected' : ''} ${
                      isValidDest && piece.player !== (isSelected ? piece.player : 'none')
                        ? 'piece-capturable'
                        : ''
                    }`}
                  >
                    {piece.isKing && (
                      <span className="king-crown">♛</span>
                    )}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default CheckerBoard;
