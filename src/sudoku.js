// Original Sudoku engine. No external libraries or assets.
const SIZE = 9;
export const shuffled = (input, rng = Math.random) => {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function randomizedSolution(rng) {
  const base = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
  const bands = shuffled([0, 1, 2], rng);
  const stacks = shuffled([0, 1, 2], rng);
  const rows = bands.flatMap(b => shuffled([0, 1, 2], rng).map(i => b * 3 + i));
  const cols = stacks.flatMap(b => shuffled([0, 1, 2], rng).map(i => b * 3 + i));
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  return rows.flatMap(r => cols.map(c => digits[base(r, c)]));
}

export function candidates(board, idx) {
  if (board[idx]) return [];
  const r = Math.floor(idx / SIZE), c = idx % SIZE;
  const used = new Set();
  for (let i = 0; i < 9; i++) { used.add(board[r * 9 + i]); used.add(board[i * 9 + c]); }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) used.add(board[(br + i) * 9 + bc + j]);
  return [1,2,3,4,5,6,7,8,9].filter(v => !used.has(v));
}

// Counts up to 'limit' to enforce a single solution while removing givens.
export function countSolutions(board, limit = 2) {
  const a = [...board];
  let total = 0;
  function solve() {
    if (total >= limit) return;
    let bestIdx = -1, bestOptions = null;
    for (let i = 0; i < 81; i++) {
      if (a[i] !== 0) continue;
      const options = candidates(a, i);
      if (options.length === 0) return;
      if (!bestOptions || options.length < bestOptions.length) {
        bestOptions = options; bestIdx = i;
        if (options.length === 1) break;
      }
    }
    if (bestIdx < 0) { total++; return; }
    for (const v of bestOptions) {
      a[bestIdx] = v;
      solve();
      if (total >= limit) break;
    }
    a[bestIdx] = 0;
  }
  solve();
  return total;
}

export function generateSudoku(difficulty = 'normal', rng = Math.random) {
  const targets = { easy: 43, normal: 36, hard: 30 };
  const target = targets[difficulty] ?? targets.normal;
  const solution = randomizedSolution(rng);
  const puzzle = [...solution];
  let filled = 81;
  for (const i of shuffled([...Array(81).keys()], rng)) {
    if (filled <= target) break;
    const n = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = n;
    else filled--;
  }
  return { puzzle, solution, difficulty };
}

export function findConflicts(board) {
  const bad = new Set();
  const groups = [];
  for (let r = 0; r < 9; r++) groups.push([...Array(9).keys()].map(c => r * 9 + c));
  for (let c = 0; c < 9; c++) groups.push([...Array(9).keys()].map(r => r * 9 + c));
  for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
    groups.push([...Array(9).keys()].map(i => (br + Math.floor(i / 3)) * 9 + bc + i % 3));
  }
  for (const group of groups) {
    const positions = new Map();
    for (const i of group) {
      const v = board[i];
      if (!v) continue;
      if (!positions.has(v)) positions.set(v, []);
      positions.get(v).push(i);
    }
    for (const list of positions.values()) if (list.length > 1) list.forEach(i => bad.add(i));
  }
  return bad;
}

export const sudokuComplete = state => state.board.every((v, i) => v === state.solution[i]);
