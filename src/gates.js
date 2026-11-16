// Original two-lane number runner logic.
export function applyGate(value, gate) {
  switch (gate.op) {
    case '+': return value + gate.amount;
    case '-': return Math.max(1, value - gate.amount);
    case '×': return value * gate.amount;
    case '÷': return Math.max(1, Math.floor(value / gate.amount));
    default: throw new Error('Unknown gate operation');
  }
}
export const formatNumber = n => new Intl.NumberFormat('ja-JP', { notation: n >= 1e9 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
const amount = (a, b, rng) => a + Math.floor(rng() * (b - a + 1));
const choice = (arr, rng) => arr[Math.floor(rng() * arr.length)];
export function generateGates(rounds = 12, rng = Math.random) {
  const stages = [];
  for (let i = 0; i < rounds; i++) {
    const pool = [
      { op: '+', amount: amount(7 + i * 3, 25 + i * 7, rng) },
      { op: '+', amount: amount(12 + i * 5, 32 + i * 9, rng) },
      { op: '×', amount: amount(2, 3, rng) },
      { op: '×', amount: 2 },
      { op: '-', amount: amount(5 + i, 20 + i * 4, rng) },
      { op: '÷', amount: 2 },
    ];
    const first = choice(pool, rng);
    let second = choice(pool, rng);
    for (let j = 0; j < 8 && first.op === second.op && first.amount === second.amount; j++) second = choice(pool, rng);
    const pair = rng() < .5 ? [first, second] : [second, first];
    stages.push(pair);
  }
  return stages;
}
export function runGate(state, lane) {
  if (state.finished || ![0, 1].includes(lane)) return state;
  const gate = state.stages[state.round]?.[lane];
  if (!gate) return state;
  const score = applyGate(state.value, gate);
  const round = state.round + 1;
  return { ...state, value: score, round, finished: round >= state.stages.length, history: [...state.history, { lane, gate, score }] };
}
