import React, { useState, useEffect, useRef } from 'react';

/* ---------- Helpers ---------- */
const posKey = ({ x, y }) => `${x},${y}`;
const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

/* ---------- Composant ---------- */
function Grille({ rows, cols }) {
  /*  Directions courantes stockées dans des refs
      (une ref garde toujours la dernière valeur sans recréer
       les listeners ou l’interval).                                   */
  const dir1 = useRef({ x: 0, y: 1 });   // ← Snake 1 part vers la droite
  const dir2 = useRef({ x: 0, y: -1 });  // ← Snake 2 part vers la gauche

  /*  Serpents – longueur 5                                              */
  const [snake1, setSnake1] = useState([
    { x: 0, y: 4 },
    { x: 0, y: 3 },
    { x: 0, y: 2 },
    { x: 0, y: 1 },
    { x: 0, y: 0 },
  ]);

  const [snake2, setSnake2] = useState([
    { x: rows - 1, y: cols - 5 },
    { x: rows - 1, y: cols - 4 },
    { x: rows - 1, y: cols - 3 },
    { x: rows - 1, y: cols - 2 },
    { x: rows - 1, y: cols - 1 },
  ]);

  /*  On garde les serpents dans des refs pour y accéder
      en lecture synchrone dans l’interval.                              */
  const snake1Ref = useRef(snake1);
  const snake2Ref = useRef(snake2);
  useEffect(() => { snake1Ref.current = snake1; }, [snake1]);
  useEffect(() => { snake2Ref.current = snake2; }, [snake2]);

  /* ---------- Clavier ---------- */
  useEffect(() => {
    const onKeyDown = ({ key }) => {
      /* Snake 1 : flèches */
      if (key === 'ArrowUp'    && !isOpposite(dir1.current, { x: -1, y:  0 })) dir1.current = { x: -1, y:  0 };
      if (key === 'ArrowDown'  && !isOpposite(dir1.current, { x:  1, y:  0 })) dir1.current = { x:  1, y:  0 };
      if (key === 'ArrowLeft'  && !isOpposite(dir1.current, { x:  0, y: -1 })) dir1.current = { x:  0, y: -1 };
      if (key === 'ArrowRight' && !isOpposite(dir1.current, { x:  0, y:  1 })) dir1.current = { x:  0, y:  1 };

      /* Snake 2 : WASD (minuscules) */
      if (key === 'w' && !isOpposite(dir2.current, { x: -1, y:  0 })) dir2.current = { x: -1, y:  0 };
      if (key === 's' && !isOpposite(dir2.current, { x:  1, y:  0 })) dir2.current = { x:  1, y:  0 };
      if (key === 'a' && !isOpposite(dir2.current, { x:  0, y: -1 })) dir2.current = { x:  0, y: -1 };
      if (key === 'd' && !isOpposite(dir2.current, { x:  0, y:  1 })) dir2.current = { x:  0, y:  1 };
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---------- Tick principal ---------- */
useEffect(() => {
  const interval = setInterval(() => {
    // 1. Positions suivantes
    const nextSnake1 = advanceSnake(snake1Ref.current, dir1.current);
    const nextSnake2 = advanceSnake(snake2Ref.current, dir2.current);

    // 2. Tests élémentaires
    const wall1 = hitsWall(nextSnake1[0]);
    const wall2 = hitsWall(nextSnake2[0]);

    const body1Set = new Set(nextSnake1.slice(1).map(posKey));
    const body2Set = new Set(nextSnake2.slice(1).map(posKey));

    const head1 = posKey(nextSnake1[0]);
    const head2 = posKey(nextSnake2[0]);

    const snake1Hits2 = body2Set.has(head1);  // tête 1 → corps 2
    const snake2Hits1 = body1Set.has(head2);  // tête 2 → corps 1
    const self1      = body1Set.has(head1);   // auto‑collision 1
    const self2      = body2Set.has(head2);   // auto‑collision 2
    const headOnHead = head1 === head2;       // tête ↔ tête

    /* ---------- Résolution ---------- */
    const snake1Loses = wall1 || self1 || snake1Hits2;
    const snake2Loses = wall2 || self2 || snake2Hits1;

    // 1) Match nul (deux perdants ou tête‑à‑tête)
    if (headOnHead || (snake1Loses && snake2Loses)) {
      alert('Match nul !');
      clearInterval(interval);
      return;
    }

    // 2) Un seul perdant
    if (snake1Loses) {
      alert('Le Serpent 1 a perdu !');
      clearInterval(interval);
      return;
    }
    if (snake2Loses) {
      alert('Le Serpent 2 a perdu !');
      clearInterval(interval);
      return;
    }

    // 3) Personne ne perd : on applique les positions
    setSnake1(nextSnake1);
    setSnake2(nextSnake2);
  }, 180);

  return () => clearInterval(interval);
}, [rows, cols]);


  /* ---------- Helpers internes ---------- */
  const hitsWall = ({ x, y }) => x < 0 || x >= rows || y < 0 || y >= cols;

  const advanceSnake = (snake, dir) => {
    const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    return [newHead, ...snake.slice(0, -1)]; // même longueur
  };

  /* ---------- Rendu grille ---------- */
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const in1 = snake1.some(seg => seg.x === r && seg.y === c);
      const in2 = snake2.some(seg => seg.x === r && seg.y === c);
      row.push(
        <div
          key={`${r}-${c}`}
          style={{
            width: 20,
            height: 20,
            backgroundColor: in1 ? 'green' : in2 ? 'blue' : 'lightgrey',
            border: '1px solid #222',
          }}
        />
      );
    }
    grid.push(
      <div key={r} style={{ display: 'flex' }}>
        {row}
      </div>
    );
  }

  return <div>{grid}</div>;
}

export default Grille;
