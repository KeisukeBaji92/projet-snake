import React, { useState, useEffect, useRef } from 'react';

/* ---------- Helpers ---------- */
const posKey = ({ x, y }) => `${x},${y}`;
const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

/* ---------- Composant ---------- */
function Grille({ rows, cols }) {
  /* Directions */
  const dir1 = useRef({ x: 0, y: 1 });
  const dir2 = useRef({ x: 0, y: -1 });

  /* Serpents (longueur 5) */
  const [snake1, setSnake1] = useState([
    { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
  ]);
  const [snake2, setSnake2] = useState([
    { x: rows - 1, y: cols - 5 }, { x: rows - 1, y: cols - 4 },
    { x: rows - 1, y: cols - 3 }, { x: rows - 1, y: cols - 2 }, { x: rows - 1, y: cols - 1 },
  ]);

  /* Scores */
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  /* Pomme */
  const [food, setFood] = useState(() => randomFood(rows, cols, snake1, snake2));

  /* Game status */
  const [status, setStatus] = useState('');        // 'Serpent 1 a gagné' / 'Match nul' …
  const [running, setRunning] = useState(true);    // stoppe l’interval quand false

  /* Refs synchro pour l’interval */
  const snake1Ref = useRef(snake1);   useEffect(() => { snake1Ref.current = snake1; }, [snake1]);
  const snake2Ref = useRef(snake2);   useEffect(() => { snake2Ref.current = snake2; }, [snake2]);

  /* ---------- Clavier ---------- */
  useEffect(() => {
    const onKeyDown = ({ key }) => {
      if (!running) return;

      // Snake 1 : flèches
      if (key === 'ArrowUp'    && !isOpposite(dir1.current, { x: -1, y: 0 })) dir1.current = { x: -1, y: 0 };
      if (key === 'ArrowDown'  && !isOpposite(dir1.current, { x:  1, y: 0 })) dir1.current = { x:  1, y: 0 };
      if (key === 'ArrowLeft'  && !isOpposite(dir1.current, { x:  0, y:-1 })) dir1.current = { x:  0, y:-1 };
      if (key === 'ArrowRight' && !isOpposite(dir1.current, { x:  0, y: 1 })) dir1.current = { x:  0, y: 1 };

      // Snake 2 : wasd
      if (key === 'w' && !isOpposite(dir2.current, { x: -1, y: 0 })) dir2.current = { x: -1, y: 0 };
      if (key === 's' && !isOpposite(dir2.current, { x:  1, y: 0 })) dir2.current = { x:  1, y: 0 };
      if (key === 'a' && !isOpposite(dir2.current, { x:  0, y:-1 })) dir2.current = { x:  0, y:-1 };
      if (key === 'd' && !isOpposite(dir2.current, { x:  0, y: 1 })) dir2.current = { x:  0, y: 1 };
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [running]);

  /* ---------- Tick principal ---------- */
  useEffect(() => {
    if (!running) return;                      // stoppe la boucle

    const interval = setInterval(() => {
      const nextSnake1 = advanceSnake(snake1Ref.current, dir1.current, food);
      const nextSnake2 = advanceSnake(snake2Ref.current, dir2.current, food);

      /* Nouvelle pomme & score si mangée */
      let newFood = food;
      let inc1 = false, inc2 = false;

      if (posKey(nextSnake1[0]) === posKey(food)) {
        inc1 = true;
        setScore1(s => s + 1);
        newFood = randomFood(rows, cols, nextSnake1, nextSnake2);
      }
      if (posKey(nextSnake2[0]) === posKey(food)) {
        inc2 = true;
        setScore2(s => s + 1);
        // si le 2 mange la pomme déjà mangée par le 1 : respawn déjà fait
        if (!inc1) newFood = randomFood(rows, cols, nextSnake1, nextSnake2);
      }

      /* Collisions */
      const hitsWall = ({ x, y }) => x < 0 || x >= rows || y < 0 || y >= cols;
      const wall1 = hitsWall(nextSnake1[0]);
      const wall2 = hitsWall(nextSnake2[0]);

      const body1Set = new Set(nextSnake1.slice(1).map(posKey));
      const body2Set = new Set(nextSnake2.slice(1).map(posKey));

      const head1 = posKey(nextSnake1[0]);
      const head2 = posKey(nextSnake2[0]);

      const snake1Hits2 = body2Set.has(head1);
      const snake2Hits1 = body1Set.has(head2);
      const self1      = body1Set.has(head1);
      const self2      = body2Set.has(head2);
      const headOnHead = head1 === head2;

      const snake1Loses = wall1 || self1 || snake1Hits2;
      const snake2Loses = wall2 || self2 || snake2Hits1;

      /* Résolution */
      if (headOnHead || (snake1Loses && snake2Loses)) {
        setStatus('Match nul !');
        setRunning(false);
        clearInterval(interval);
        return;
      }
      if (snake1Loses) {
        setStatus('Le Serpent 1 a perdu !');
        setRunning(false);
        clearInterval(interval);
        return;
      }
      if (snake2Loses) {
        setStatus('Le Serpent 2 a perdu !');
        setRunning(false);
        clearInterval(interval);
        return;
      }

      /* Appliquer les nouveaux serpents : si pomme mangée on ne coupe pas la queue */
      setSnake1(inc1 ? nextSnake1 : nextSnake1.slice(0, -1).concat(nextSnake1.at(-1)));
      setSnake2(inc2 ? nextSnake2 : nextSnake2.slice(0, -1).concat(nextSnake2.at(-1)));
      setFood(newFood);
    }, 140);

    return () => clearInterval(interval);
  }, [running, rows, cols, food]);

  /* ---------- Helpers internes ---------- */
  function advanceSnake(snake, dir, currentFood) {
    const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const ate = posKey(newHead) === posKey(currentFood);
    return ate ? [newHead, ...snake] : [newHead, ...snake.slice(0, -1)];
  }

  /* ---------- Rendu ---------- */
  const gridRows = [];
  for (let r = 0; r < rows; r++) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const in1 = snake1.some(seg => seg.x === r && seg.y === c);
      const in2 = snake2.some(seg => seg.x === r && seg.y === c);
      const isFood = food.x === r && food.y === c;

      rowCells.push(
        <div
          key={`${r}-${c}`}
          style={{
            width: 20, height: 20,
            backgroundColor: isFood ? 'red' : in1 ? 'green' : in2 ? 'blue' : 'lightgrey',
            border: '1px solid #222',
          }}
        />
      );
    }
    gridRows.push(<div key={r} style={{ display: 'flex' }}>{rowCells}</div>);
  }

  /* ---------- Restart ---------- */
  const restart = () => {
    setSnake1([
      { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
    ]);
    setSnake2([
      { x: rows - 1, y: cols - 5 }, { x: rows - 1, y: cols - 4 },
      { x: rows - 1, y: cols - 3 }, { x: rows - 1, y: cols - 2 }, { x: rows - 1, y: cols - 1 },
    ]);
    setScore1(0);
    setScore2(0);
    setFood(randomFood(rows, cols, snake1, snake2));
    dir1.current = { x: 0, y: 1 };
    dir2.current = { x: 0, y: -1 };
    setStatus('');
    setRunning(true);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', height: '100vh',
      fontFamily: 'sans-serif',
    }}>
      <h2>{status || 'Snake VS Snake'}</h2>
      <p style={{ margin: 4 }}>Score 1 : {score1} — Score 2 : {score2}</p>
      {gridRows}
      {!running && <button onClick={restart} style={{ marginTop: 12 }}>Rejouer</button>}
    </div>
  );
}

/* ---------- Fonction utilitaire : spawn de pomme ---------- */
function randomFood(rows, cols, s1, s2) {
  const occupied = new Set([...s1, ...s2].map(posKey));
  let x, y;
  do {
    x = Math.floor(Math.random() * rows);
    y = Math.floor(Math.random() * cols);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}

export default Grille;
