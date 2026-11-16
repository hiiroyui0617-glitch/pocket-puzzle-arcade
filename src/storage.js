const KEY = 'pocket-puzzle-arcade-v1';
export const defaults = () => ({
  settings: { sound: true },
  stats: { sudokuWins: 0, sudokuBest: null, gatesBest: 0, gatesRuns: 0, blocksBest: 0, blocksGames: 0 },
  sudoku: null, gates: null, blocks: null,
});
export function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaults();
    const d = defaults();
    return { ...d, ...raw, settings: { ...d.settings, ...raw.settings }, stats: { ...d.stats, ...raw.stats } };
  } catch { return defaults(); }
}
export function saveData(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch { /* Private browsing and quota limits: game remains playable */ }
}
