// Original 8x8 block placement puzzle logic.
export const GRID = 8;
const SHAPES = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]],
  [[0,0],[1,0],[2,0]], [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[0,1]], [[0,0],[0,1],[1,1]], [[1,0],[0,1],[1,1]], [[0,0],[1,0],[1,1]],
  [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[1,0],[2,0],[1,1]], [[1,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]], [[0,0],[0,1],[0,2],[0,3],[0,4]],
  [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]],
  [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
  [[0,0],[1,0],[2,0],[1,1],[1,2]], [[1,0],[0,1],[1,1],[2,1],[1,2]],
];
export function randomPiece(rng = Math.random) {
  const index = Math.floor(rng() * SHAPES.length);
  return { cells: SHAPES[index].map(x => [...x]), color: Math.floor(rng() * 5) + 1 };
}
export const newBlockState = (rng = Math.random) => ({
  board: Array(64).fill(0), pieces: Array.from({ length: 3 }, () => randomPiece(rng)),
  score: 0, combo: 0, moves: 0, over: false,
});
export function fits(board, piece, row, col) {
  if (!piece || !Array.isArray(piece.cells)) return false;
  return piece.cells.every(([x,y]) => row + y < GRID && col + x < GRID && row + y >= 0 && col + x >= 0 && !board[(row + y) * GRID + col + x]);
}
export function canPlaceAnywhere(board, piece) {
  if (!piece) return false;
  for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) if (fits(board, piece, row, col)) return true;
  return false;
}
export function placePiece(state, pieceIndex, row, col, rng = Math.random) {
  if (state.over || !fits(state.board, state.pieces[pieceIndex], row, col)) return null;
  const piece = state.pieces[pieceIndex];
  const board = [...state.board];
  for (const [x,y] of piece.cells) board[(row + y) * GRID + col + x] = piece.color;
  const clearRows = [], clearCols = [];
  for (let r = 0; r < GRID; r++) if (board.slice(r * GRID, r * GRID + GRID).every(Boolean)) clearRows.push(r);
  for (let c = 0; c < GRID; c++) if ([...Array(GRID).keys()].every(r => board[r * GRID + c])) clearCols.push(c);
  for (const r of clearRows) for (let c = 0; c < GRID; c++) board[r * GRID + c] = 0;
  for (const c of clearCols) for (let r = 0; r < GRID; r++) board[r * GRID + c] = 0;
  const lines = clearRows.length + clearCols.length;
  const combo = lines ? state.combo + 1 : 0;
  const score = state.score + piece.cells.length * 5 + (lines ? lines * 100 * combo : 0);
  let pieces = state.pieces.map((p, i) => i === pieceIndex ? null : p);
  if (pieces.every(p => p === null)) pieces = Array.from({ length: 3 }, () => randomPiece(rng));
  const over = !pieces.some(p => p && canPlaceAnywhere(board, p));
  return { board, pieces, score, combo, moves: state.moves + 1, over, lines };
}
export function getPreview(piece, row, col) {
  return new Set(piece?.cells.map(([x,y]) => (row + y) * GRID + col + x) ?? []);
}
