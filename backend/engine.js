// backend/engine.js     (ES module)

export const ROWS = 20;
export const COLS = 30;
const START_LEN = 5;
const DECAY = 0.95;
const MIN_MS = 60;

export function initGame() {
  const snake1 = Array.from({ length: START_LEN }, (_, i) => ({ x: 0, y: START_LEN - 1 - i }));
  const snake2 = Array.from({ length: START_LEN }, (_, i) => ({ x: ROWS - 1, y: COLS - START_LEN + i }));
  return {
    rows: ROWS,
    cols: COLS,
    s1: snake1,
    s2: snake2,
    dir1: { x: 0, y: 1 },
    dir2: { x: 0, y: -1 },
    food: spawnFood([...snake1, ...snake2]),
    speedMs: 200
  };
}

export function tick(prev, d1, d2) {
  // Verrou anti-demi-tour
  if (isOpposite(d1, opposite(prev.dir1))) d1 = prev.dir1;
  if (isOpposite(d2, opposite(prev.dir2))) d2 = prev.dir2;

  // 1 – nouvelles têtes
  const h1 = { x: prev.s1[0].x + d1.x, y: prev.s1[0].y + d1.y };
  const h2 = { x: prev.s2[0].x + d2.x, y: prev.s2[0].y + d2.y };

  // 2 – sets corps pour lookup rapide
  const body1 = new Set(prev.s1.slice(1).map(posKey));
  const body2 = new Set(prev.s2.slice(1).map(posKey));

  // 3 – collisions
  const wall1 = hitsWall(h1, prev), wall2 = hitsWall(h2, prev);
  const self1 = body1.has(posKey(h1)), self2 = body2.has(posKey(h2));
  const hit12 = body2.has(posKey(h1)), hit21 = body1.has(posKey(h2));
  const headOn = h1.x === h2.x && h1.y === h2.y;

  if (headOn || ((wall1||self1||hit12) && (wall2||self2||hit21)))
    return { draw: true };

  if (wall1 || self1 || hit12) return { loser: 1 };
  if (wall2 || self2 || hit21) return { loser: 2 };

  // 4 – pomme ?
  const ate1 = h1.x === prev.food.x && h1.y === prev.food.y;
  const ate2 = h2.x === prev.food.x && h2.y === prev.food.y;

  const nextS1 = ate1 ? [h1, ...prev.s1] : [h1, ...prev.s1.slice(0, -1)];
  const nextS2 = ate2 ? [h2, ...prev.s2] : [h2, ...prev.s2.slice(0, -1)];

  const nextFood = (ate1 || ate2) ? spawnFood([...nextS1, ...nextS2]) : prev.food;
  const nextSpeed = (ate1 || ate2)
    ? Math.max(MIN_MS, prev.speedMs * DECAY)
    : prev.speedMs;

  return {
    state: {
      ...prev,
      s1: nextS1,
      s2: nextS2,
      dir1: d1,
      dir2: d2,
      food: nextFood,
      speedMs: nextSpeed
    }
  };
}

/* ---------------- petits helpers ---------------- */
function posKey({ x, y }) { return `${x},${y}`; }
function hitsWall({ x, y }, g) { return x < 0 || x >= g.rows || y < 0 || y >= g.cols; }
function isOpposite(a, b) { return a.x === -b.x && a.y === -b.y; }
const opposite = d => ({ x: -d.x, y: -d.y });

function spawnFood(occupied) {
  while (true) {
    const p = { x: ~~(Math.random()*ROWS), y: ~~(Math.random()*COLS) };
    if (!occupied.some(o => o.x === p.x && o.y === p.y)) return p;
  }
}
