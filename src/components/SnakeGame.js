import React, { useEffect, useRef, useState } from 'react';

const CELL = 24;
const TICK = 200;

const COL_BG   = '#1e1e1e';
const COL_S1   = '#ff595e';
const COL_S2   = '#1982c4';
const COL_FOOD = '#8ac926';

export default function SnakeGame({
  userMove,
  userMove2 = null,
  mode,
  onEnd,
  rows = 20,
  cols = 20,
}) {
  const canvas = useRef(null);
  const state = useRef(initState(rows, cols));
  const [score, setScore] = useState({ s1: 0, s2: 0 });

  useEffect(() => {
    const ctx = canvas.current.getContext('2d');

    const timer = setInterval(() => {
      const st = state.current;
      if (st.gameOver) return;

      const d1 = getSafeDir(userMove, view(st, st.snake1, st.snake2), st.dir1);

      let d2;
      if (mode === 'mirror') {
        d2 = getSafeDir(userMove, view(st, st.snake2, st.snake1), st.dir2);
      } else if (mode === 'duel') {
        d2 = userMove2 
          ? getSafeDir(userMove2, view(st, st.snake2, st.snake1), st.dir2)
          : smartBot(view(st, st.snake2, st.snake1), st.dir2);
      } else {
        d2 = smartBot(view(st, st.snake2, st.snake1), st.dir2);
      }

      st.dir1 = d1;
      st.dir2 = d2;

      move(st.snake1, d1);
      move(st.snake2, d2);

      const changed = handleCollisions(st, rows, cols);
      if (changed) setScore({ s1: st.score1, s2: st.score2 });

      draw(ctx, st, rows, cols);
      if (st.gameOver && onEnd) onEnd(st.winner);
    }, TICK);

    draw(ctx, state.current, rows, cols);
    return () => clearInterval(timer);
  }, [userMove, userMove2, mode, onEnd, rows, cols]);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
        <span style={{ color: COL_S1 }}>ROUGE : {score.s1}</span>
        &nbsp;&nbsp;
        <span style={{ color: COL_S2 }}>BLEU : {score.s2}</span>
      </div>
      <canvas
        ref={canvas}
        width={cols * CELL}
        height={rows * CELL}
        style={{ border: '1px solid #444', borderRadius: 4 }}
      />
    </div>
  );
}

function getSafeDir(fn, state, prevDir) {
  try {
    const dir = fn(state);
    return secureDir(dir, prevDir);
  } catch (err) {
    console.warn('Erreur dans un script joueur :', err.message);
    return prevDir;
  }
}

function initState(r, c) {
  return {
    snake1: buildSnake({ x: 3, y: 3 }, 'right', 3),
    dir1: 'right',
    snake2: buildSnake({ x: r - 4, y: c - 4 }, 'left', 3),
    dir2: 'left',
    food: placeFood([], [], r, c),
    score1: 0,
    score2: 0,
    gameOver: false,
    winner: null,
    rows: r,
    cols: c,
  };
}

function buildSnake(head, dir, len) {
  const d = DIR_VEC[dir];
  return Array.from({ length: len }, (_, i) => ({
    x: head.x - i * d.x,
    y: head.y - i * d.y,
  }));
}

const DIR_VEC = {
  up: { x: -1, y: 0 },
  down: { x: 1, y: 0 },
  left: { x: 0, y: -1 },
  right: { x: 0, y: 1 },
};

const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

function secureDir(dir, prev) {
  if (!DIR_VEC[dir] || dir === OPP[prev]) return prev;
  return dir;
}

const view = (st, me, you) => ({ rows: st.rows, cols: st.cols, food: st.food, me, you });

function move(snake, dir) {
  const h = { ...snake[0] };
  h.x += DIR_VEC[dir].x;
  h.y += DIR_VEC[dir].y;
  snake.unshift(h);
}

function handleCollisions(st, rows, cols) {
  const out = c => c.x < 0 || c.y < 0 || c.x >= rows || c.y >= cols;
  const hit = (c, body) => body.some(p => p.x === c.x && p.y === c.y);

  const h1 = st.snake1[0];
  const h2 = st.snake2[0];
  let changed = false;

  [st.snake1, st.snake2].forEach((snake, idx) => {
    const h = snake[0];
    if (h.x === st.food.x && h.y === st.food.y) {
      if (idx === 0) st.score1++; else st.score2++;
      st.food = placeFood(st.snake1, st.snake2, rows, cols);
      changed = true;
    } else {
      snake.pop();
    }
  });

  if (out(h1) || hit(h1, st.snake1.slice(1)) || hit(h1, st.snake2)) {
    st.gameOver = true; st.winner = 'bot 2';
  }
  if (out(h2) || hit(h2, st.snake2.slice(1)) || hit(h2, st.snake1)) {
    st.gameOver = true; st.winner = st.winner ? 'draw' : 'bot 1';
  }
  if (h1.x === h2.x && h1.y === h2.y) {
    st.gameOver = true; st.winner = 'draw';
  }

  return changed;
}

function placeFood(s1, s2, rows, cols) {
  const occ = new Set([...s1, ...s2].map(c => `${c.x},${c.y}`));
  const free = [];
  for (let x = 0; x < rows; x++)
    for (let y = 0; y < cols; y++)
      if (!occ.has(`${x},${y}`)) free.push({ x, y });
  return free[Math.random() * free.length | 0];
}

function smartBot(state, prev) {
  const { rows, cols, food, me, you } = state;
  const start = me[0];
  const blocked = new Set([...me, ...you].map(c => `${c.x},${c.y}`));
  const queue = [{ x: start.x, y: start.y, first: null }];
  const seen = new Set([`${start.x},${start.y}`]);
  const DIRS = ['up', 'down', 'left', 'right'];

  while (queue.length) {
    const node = queue.shift();
    for (const dir of DIRS) {
      const nx = node.x + DIR_VEC[dir].x;
      const ny = node.y + DIR_VEC[dir].y;
      if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) continue;
      const key = `${nx},${ny}`;
      if (blocked.has(key) || seen.has(key)) continue;

      const first = node.first ?? dir;
      if (nx === food.x && ny === food.y)
        return secureDir(first, prev);

      queue.push({ x: nx, y: ny, first });
      seen.add(key);
    }
  }

  for (const dir of DIRS) {
    if (dir === OPP[prev]) continue;
    const nx = start.x + DIR_VEC[dir].x;
    const ny = start.y + DIR_VEC[dir].y;
    if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) continue;
    if (!blocked.has(`${nx},${ny}`)) return dir;
  }
  return prev;
}

function draw(ctx, st, rows, cols) {
  // Effacer le canvas
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, cols * CELL, rows * CELL);

  // Dessiner la nourriture
  ctx.fillStyle = COL_FOOD;
  ctx.beginPath();
  ctx.arc(
    (st.food.y + 0.5) * CELL,
    (st.food.x + 0.5) * CELL,
    CELL * 0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Fonction helper pour dessiner un serpent
  const drawSnake = (snake, color) => {
    ctx.fillStyle = color;
    snake.forEach(({ x, y }, i) => {
      if (i === 0) {
        // Tête du serpent
        ctx.fillRect(y * CELL, x * CELL, CELL, CELL);
        // Yeux
        ctx.fillStyle = '#000';
        const eyeSize = CELL * 0.15;
        const eyeOffset = CELL * 0.2;
        ctx.fillRect(
          y * CELL + eyeOffset,
          x * CELL + eyeOffset,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          y * CELL + CELL - eyeOffset - eyeSize,
          x * CELL + eyeOffset,
          eyeSize,
          eyeSize
        );
        ctx.fillStyle = color;
      } else {
        // Corps du serpent
        ctx.fillRect(
          y * CELL + 1,
          x * CELL + 1,
          CELL - 2,
          CELL - 2
        );
      }
    });
  };

  // Dessiner les deux serpents
  drawSnake(st.snake1, COL_S1);
  drawSnake(st.snake2, COL_S2);
} 