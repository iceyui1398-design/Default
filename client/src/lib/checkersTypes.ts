export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'bot' | 'friend';
export type PlayerSide = 'player1' | 'player2'; // player1=white/bottom, player2=dark/top

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  player: PlayerSide;
  isKing: boolean;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
}

export interface HistoryEntry {
  board: Board;
  p1Count: number;
  p2Count: number;
}

export interface Settings {
  mandatoryJump: boolean;
}
