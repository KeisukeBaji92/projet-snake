import React, { useEffect, useRef, useState, memo, useCallback } from 'react';

const CELL = 24;
const TICK = 200;
const VISION_RANGE = 3; // Nombre de cases de vision autour de la tête en mode difficile
const BOMB_COUNT = 4; // Nombre de bombes en mode difficile

const COL_BG   = '#1e1e1e';
const COL_S1   = '#ff595e';
const COL_S2   = '#1982c4';
const COL_FOOD = '#8ac926';

// Composant Timer optimisé avec memo pour éviter les re-rendus inutiles
const Timer = memo(function Timer({ startTime, isRunning }) {
  const [time, setTime] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    if (!isRunning) return;

    const updateTimer = () => {
      setTime(Math.floor((Date.now() - startTime) / 1000));
      frameRef.current = requestAnimationFrame(updateTimer);
    };
    frameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [startTime, isRunning]);

  return (
    <div className="timer">
      Temps : {formatTime(time)}
    </div>
  );
});

export default function SnakeGame({
  userMove,
  userMove2 = null,
  mode,
  difficulty = 'normal',
  onEnd,
  rows = 20,
  cols = 20,
}) {
  const canvas = useRef(null);
  const state = useRef(initState(rows, cols));
  const [score, setScore] = useState({ s1: 0, s2: 0 });
  const startTimeRef = useRef(Date.now());
  const [isRunning, setIsRunning] = useState(true);
  const hasEndedRef = useRef(false);
  const [bombs, setBombs] = useState([]);

  const handleGameOver = useCallback((st) => {
    if (!hasEndedRef.current) {
      setIsRunning(false);
      hasEndedRef.current = true;
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onEnd && onEnd({
        winner: st.winner,
        time: formatTime(finalTime),
        scores: {
          snake1: st.score1,
          snake2: st.score2
        }
      });
    }
  }, [onEnd]);

  useEffect(() => {
    const ctx = canvas.current.getContext('2d');

    const timer = setInterval(() => {
      const st = state.current;
      if (st.gameOver) {
        handleGameOver(st);
        return;
      }

      const d1 = getSafeDir(userMove, view(st, st.snake1, st.snake2), st.dir1);

      let d2;
      if (mode === 'mirror') {
        d2 = getSafeDir(userMove, view(st, st.snake2, st.snake1), st.dir2);
      } else if (mode === 'script-vs-script') {
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
    }, TICK);

    draw(ctx, state.current, rows, cols);
    return () => clearInterval(timer);
  }, [userMove, userMove2, mode, handleGameOver, rows, cols]);

  // Initialiser les bombes pour le mode difficile
  useEffect(() => {
    if (difficulty === 'hard') {
      const newBombs = [];
      while (newBombs.length < BOMB_COUNT) {
        const bomb = {
          x: Math.floor(Math.random() * rows),
          y: Math.floor(Math.random() * cols)
        };
        // Éviter de placer des bombes sur les serpents ou la nourriture
        if (!isPositionOccupied(bomb, [...state.current.snake1, ...state.current.snake2, state.current.food, ...newBombs])) {
          newBombs.push(bomb);
        }
      }
      setBombs(newBombs);
    }
  }, [difficulty]);

  // Vérifier si une position est occupée
  const isPositionOccupied = (pos, positions) => {
    return positions.some(p => p.x === pos.x && p.y === pos.y);
  };

  // Obtenir la grille de vision limitée pour un serpent
  const getLimitedVisionGrid = (head) => {
    const grid = Array(VISION_RANGE * 2 + 1).fill().map(() => 
      Array(VISION_RANGE * 2 + 1).fill(0)
    );

    for (let i = -VISION_RANGE; i <= VISION_RANGE; i++) {
      for (let j = -VISION_RANGE; j <= VISION_RANGE; j++) {
        const x = head.x + i;
        const y = head.y + j;
        
        // Hors limites
        if (x < 0 || x >= rows || y < 0 || y >= cols) {
          grid[i + VISION_RANGE][j + VISION_RANGE] = 4; // Mur
          continue;
        }

        // Vérifier le contenu de la case
        if (isPositionOccupied({ x, y }, state.current.snake1) || isPositionOccupied({ x, y }, state.current.snake2)) {
          grid[i + VISION_RANGE][j + VISION_RANGE] = 3; // Corps de serpent
        } else if (state.current.food.x === x && state.current.food.y === y) {
          grid[i + VISION_RANGE][j + VISION_RANGE] = 1; // Nourriture
        } else if (difficulty === 'hard' && bombs.some(b => b.x === x && b.y === y)) {
          grid[i + VISION_RANGE][j + VISION_RANGE] = 2; // Bombe
        }
      }
    }
    return grid;
  };

  // Préparer l'état du jeu pour les scripts
  const getGameState = (isSnake1) => {
    const head = isSnake1 ? state.current.snake1[0] : state.current.snake2[0];
    
    if (difficulty === 'hard') {
      return {
        vision_grid: getLimitedVisionGrid(head),
        head_position: head,
        score: isSnake1 ? state.current.score1 : state.current.score2
      };
    }

    return {
      me: isSnake1 ? state.current.snake1 : state.current.snake2,
      opponent: isSnake1 ? state.current.snake2 : state.current.snake1,
      food: state.current.food,
      score: isSnake1 ? state.current.score1 : state.current.score2
    };
  };

  // Vérifier la collision avec une bombe
  const checkBombCollision = (head) => {
    return difficulty === 'hard' && bombs.some(bomb => 
      bomb.x === head.x && bomb.y === head.y
    );
  };

  // Fonction pour dessiner des yeux sur une tête de serpent
  const drawEyes = (ctx, x, y, color) => {
    const centerX = y * CELL + CELL / 2;
    const centerY = x * CELL + CELL / 2;
    const eyeSize = CELL / 8;
    const eyeOffset = CELL / 4;

    // Yeux blancs
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeSize, 0, 2 * Math.PI);
    ctx.fill();

    // Pupilles noires
    ctx.fillStyle = 'black';
    const pupilSize = eyeSize / 2;
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - eyeOffset, pupilSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + eyeOffset, centerY - eyeOffset, pupilSize, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Mise à jour du rendu
  const draw = (ctx, st, rows, cols) => {
    ctx.clearRect(0, 0, cols * CELL, rows * CELL);

    // Dessiner les bombes
    if (difficulty === 'hard') {
      ctx.fillStyle = '#FF4444';
      bombs.forEach(bomb => {
        ctx.beginPath();
        ctx.arc(
          bomb.y * CELL + CELL/2,
          bomb.x * CELL + CELL/2,
          CELL/2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    }

    // Dessiner la nourriture
    ctx.fillStyle = COL_FOOD;
    ctx.fillRect(st.food.y * CELL, st.food.x * CELL, CELL, CELL);

    // Dessiner les serpents
    ctx.fillStyle = COL_S1;
    st.snake1.forEach(c => ctx.fillRect(c.y * CELL, c.x * CELL, CELL, CELL));

    ctx.fillStyle = COL_S2;
    st.snake2.forEach(c => ctx.fillRect(c.y * CELL, c.x * CELL, CELL, CELL));

    // Dessiner les yeux sur les têtes
    if (st.snake1.length > 0) {
      drawEyes(ctx, st.snake1[0].x, st.snake1[0].y, COL_S1);
    }
    if (st.snake2.length > 0) {
      drawEyes(ctx, st.snake2[0].x, st.snake2[0].y, COL_S2);
    }

    // En mode difficile, dessiner la zone de vision
    if (difficulty === 'hard') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      const head1 = st.snake1[0];
      ctx.strokeRect(
        (head1.y - VISION_RANGE) * CELL,
        (head1.x - VISION_RANGE) * CELL,
        (VISION_RANGE * 2 + 1) * CELL,
        (VISION_RANGE * 2 + 1) * CELL
      );
    }
  };

  function moveSnake(snake, direction, st) {
    const head = { ...snake[0] };
    
    switch(direction) {
      case 'up': head.x--; break;
      case 'down': head.x++; break;
      case 'left': head.y--; break;
      case 'right': head.y++; break;
    }

    // Vérifier collision avec les murs
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
      return { newSnake: snake, collision: true, ate: false };
    }

    // Vérifier collision avec les bombes en mode difficile
    if (difficulty === 'hard' && checkBombCollision(head)) {
      return { newSnake: snake, collision: true, ate: false };
    }

    // Vérifier collision avec soi-même ou l'autre serpent
    if (isPositionOccupied(head, [...snake.slice(1), ...st.snake1, ...st.snake2])) {
      return { newSnake: snake, collision: true, ate: false };
    }

    const ate = head.x === st.food.x && head.y === st.food.y;
    const newSnake = [head, ...snake.slice(0, ate ? snake.length : snake.length - 1)];

    return { newSnake, collision: false, ate };
  }

  function gameLoop() {
    if (!isRunning) return;

    const st = state.current;
    
    // Sauvegarder les directions précédentes
    st.prevDir1 = st.dir1;
    st.prevDir2 = st.dir2;
    
    // Obtenir les mouvements des scripts
    let move1 = 'right';
    let move2 = 'left';

    try {
      move1 = userMove(getGameState(true)) || 'right';
      if (mode === 'script-vs-script' && userMove2) {
        move2 = userMove2(getGameState(false)) || 'left';
      } else if (mode === 'mirror') {
        move2 = move1;
      }
    } catch (error) {
      console.error('Erreur dans l\'exécution du script:', error);
    }

    // Mettre à jour les directions actuelles
    st.dir1 = move1;
    st.dir2 = move2;

    // Appliquer les mouvements
    const { newSnake: newSnake1, collision: col1, ate: ate1 } = moveSnake(st.snake1, move1, st);
    const { newSnake: newSnake2, collision: col2, ate: ate2 } = moveSnake(st.snake2, move2, st);

    // Mettre à jour l'état
    const newState = {
      ...st,
      snake1: newSnake1,
      snake2: newSnake2,
      score1: st.score1 + (ate1 ? 1 : 0),
      score2: st.score2 + (ate2 ? 1 : 0)
    };

    // Générer nouvelle nourriture si mangée
    if (ate1 || ate2) {
      newState.food = spawnFood(newSnake1, newSnake2, rows, cols);
    }

    // Vérifier fin de partie
    if (col1 || col2) {
      handleGameOver(newState);
      return;
    }

    state.current = newState;
    draw(canvas.current.getContext('2d'), newState, rows, cols);
  }

  return (
    <div style={{ marginTop: 20, position: 'relative' }}>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <div>
          <span style={{ color: COL_S1 }}>ROUGE : {score.s1}</span>
          &nbsp;&nbsp;
          <span style={{ color: COL_S2 }}>BLEU : {score.s2}</span>
        </div>
      </div>
      <Timer startTime={startTimeRef.current} isRunning={isRunning} />
      <canvas
        ref={canvas}
        width={cols * CELL}
        height={rows * CELL}
        style={{ border: '1px solid #444', borderRadius: 4 }}
      />
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/* === Anti-crash joueur === */
function getSafeDir(fn, state, prevDir) {
  try {
    const dir = fn(state);
    return secureDir(dir, prevDir);
  } catch (err) {
    console.warn('Erreur dans un script joueur :', err.message);
    return prevDir;
  }
}

/* === Helpers existants === */

function initState(r, c) {
  return {
    snake1: buildSnake({ x: 3, y: 3 }, 'right', 3),
    dir1: 'right',
    prevDir1: 'right',
    snake2: buildSnake({ x: r - 4, y: c - 4 }, 'left', 3),
    dir2: 'left',
    prevDir2: 'left',
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

// Normaliser les coordonnées pour que les deux serpents aient la même perspective
const view = (st, me, you) => {
  // Pour le serpent rouge (snake1), on garde tout tel quel
  if (me === st.snake1) {
    return { 
      rows: st.rows, 
      cols: st.cols, 
      food: st.food, 
      me, 
      you 
    };
  }
  
  // Pour le serpent bleu (snake2), on garde les coordonnées telles quelles aussi
  return {
    rows: st.rows,
    cols: st.cols,
    food: st.food,
    me,
    you
  };
};

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

  // 1. Gérer la nourriture d'abord
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

  // 2. Vérifier les collisions fatales
  const s1HitsWall = out(h1);
  const s2HitsWall = out(h2);
  const s1HitsSnake = hit(h1, st.snake1.slice(1)) || hit(h1, st.snake2);
  const s2HitsSnake = hit(h2, st.snake2.slice(1)) || hit(h2, st.snake1);
  const headCollision = h1.x === h2.x && h1.y === h2.y;

  // 3. Déterminer le gagnant selon les règles suivantes :
  // - Si un serpent se cogne dans l'autre, l'autre gagne
  // - Si les deux têtes se rencontrent, on regarde qui a changé de direction
  // - Si un serpent sort du terrain ou se cogne dans lui-même, l'autre gagne
  
  if (headCollision) {
    st.gameOver = true;
    const dir1Changed = st.dir1 !== st.prevDir1;
    const dir2Changed = st.dir2 !== st.prevDir2;
    
    if (dir1Changed && !dir2Changed) {
      st.winner = 'snake2';
    } else if (!dir1Changed && dir2Changed) {
      st.winner = 'snake1';
    } else {
      st.winner = 'draw';
    }
  } else if (s1HitsWall || s1HitsSnake) {
    st.gameOver = true;
    st.winner = 'snake2';
  } else if (s2HitsWall || s2HitsSnake) {
    st.gameOver = true;
    st.winner = 'snake1';
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

  // Vérifier d'abord si une direction mène directement à un mur
  function willHitWall(x, y, dir) {
    const nx = x + DIR_VEC[dir].x;
    const ny = y + DIR_VEC[dir].y;
    return nx < 0 || ny < 0 || nx >= rows || ny >= cols;
  }

  // Recherche de chemin vers la nourriture
  while (queue.length) {
    const node = queue.shift();
    for (const dir of DIRS) {
      const nx = node.x + DIR_VEC[dir].x;
      const ny = node.y + DIR_VEC[dir].y;
      if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) continue;
      const key = `${nx},${ny}`;
      if (blocked.has(key) || seen.has(key)) continue;

      const first = node.first ?? dir;
      if (nx === food.x && ny === food.y) {
        // Vérifier si cette direction est sûre
        if (!willHitWall(start.x, start.y, first)) {
          return secureDir(first, prev);
        }
      }

      queue.push({ x: nx, y: ny, first });
      seen.add(key);
    }
  }

  // Si pas de chemin vers la nourriture, chercher une direction sûre
  const safeDirs = DIRS.filter(dir => {
    if (dir === OPP[prev]) return false;
    const nx = start.x + DIR_VEC[dir].x;
    const ny = start.y + DIR_VEC[dir].y;
    if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) return false;
    return !blocked.has(`${nx},${ny}`);
  });

  return safeDirs.length > 0 ? safeDirs[0] : prev;
}

// Fonction pour générer de la nourriture à une position aléatoire libre
function spawnFood(snake1, snake2, rows, cols) {
  // Créer un ensemble des positions occupées
  const occupied = new Set();
  [...snake1, ...snake2].forEach(pos => {
    occupied.add(`${pos.x},${pos.y}`);
  });

  // Trouver toutes les positions libres
  const freePositions = [];
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      if (!occupied.has(`${x},${y}`)) {
        freePositions.push({ x, y });
      }
    }
  }

  // Retourner une position aléatoire parmi les positions libres
  return freePositions[Math.floor(Math.random() * freePositions.length)];
}
