// src/components/Grille.js
import React, { useState, useEffect, useRef } from 'react';

export default function SnakeBoard({ rows = 20, cols = 30 }) {
  // Bot directions
  const dir1 = useRef({ x: 0, y: 1 });
  const dir2 = useRef({ x: 0, y: -1 });
  const prevDir1 = useRef({ x: 0, y: 1 });
  const prevDir2 = useRef({ x: 0, y: -1 });

  // Speed settings
  const initialSpeed = 200;
  const minSpeed     =  60;
  const decay        = 0.95;
  const speedRef     = useRef(initialSpeed);
  const loopRef      = useRef(null);

  // Game state
  const [snake1, setSnake1] = useState([]);
  const [snake2, setSnake2] = useState([]);
  const [food, setFood]     = useState(null);
  const [scores, setScores] = useState({ s1: 0, s2: 0 });
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);

  // Refs to sync state
  const s1Ref = useRef(snake1);
  const s2Ref = useRef(snake2);
  const foodRef = useRef(food);
  useEffect(() => { s1Ref.current = snake1; }, [snake1]);
  useEffect(() => { s2Ref.current = snake2; }, [snake2]);
  useEffect(() => { foodRef.current = food; }, [food]);

  // Helpers
  const posKey = p => `${p.x},${p.y}`;
  const hitsWall = p => p.x < 0 || p.x >= rows || p.y < 0 || p.y >= cols;
  const spawnFood = occupied => {
    while (true) {
      const p = { x: Math.floor(Math.random()*rows), y: Math.floor(Math.random()*cols) };
      if (!occupied.some(o => o.x === p.x && o.y === p.y)) return p;
    }
  };
  // Greedy bot with avoidance
  const getBotDir = (head, body, otherBody, target) => {
    const dx = target.x - head.x;
    const dy = target.y - head.y;
    const options = [];
    // primary and secondary
    if (Math.abs(dx) > Math.abs(dy)) {
      options.push({ x: Math.sign(dx), y: 0 }, { x: 0, y: Math.sign(dy) });
    } else {
      options.push({ x: 0, y: Math.sign(dy) }, { x: Math.sign(dx), y: 0 });
    }
    // all directions fallback
    options.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });
    for (const d of options) {
      const next = { x: head.x + d.x, y: head.y + d.y };
      if (!hitsWall(next)
          && !body.some(p => p.x===next.x && p.y===next.y)
          && !otherBody.some(p => p.x===next.x && p.y===next.y)) {
        return d;
      }
    }
    // no safe, keep prev
    return body === s1Ref.current ? prevDir1.current : prevDir2.current;
  };

  // Initialize/reset
  const resetGame = () => {
    const s1 = [ {x:0,y:4},{x:0,y:3},{x:0,y:2},{x:0,y:1},{x:0,y:0} ];
    const s2 = [ {x:rows-1,y:cols-5},{x:rows-1,y:cols-4},{x:rows-1,y:cols-3},{x:rows-1,y:cols-2},{x:rows-1,y:cols-1} ];
    const f  = spawnFood([...s1, ...s2]);

    setSnake1(s1);
    setSnake2(s2);
    setFood(f);
    setScores({ s1:0, s2:0 });
    setStatus('');
    dir1.current = { x:0, y:1 };
    dir2.current = { x:0, y:-1 };
    prevDir1.current = { ...dir1.current };
    prevDir2.current = { ...dir2.current };
    speedRef.current = initialSpeed;
    clearTimeout(loopRef.current);
    setRunning(true);
  };
  useEffect(resetGame, []);

  // Main loop
  const scheduleNext = () => {
    loopRef.current = setTimeout(gameTick, speedRef.current);
  };
  function gameTick() {
    if (!running) return;

    const oldS1 = s1Ref.current;
    const oldS2 = s2Ref.current;
    const f     = foodRef.current;

    const oldDir1 = { ...dir1.current };
    const oldDir2 = { ...dir2.current };

    // compute new dirs
    const newDir1 = getBotDir(oldS1[0], oldS1, oldS2, f);
    const newDir2 = getBotDir(oldS2[0], oldS2, oldS1, f);
    dir1.current = newDir1;
    dir2.current = newDir2;
    prevDir1.current = oldDir1;
    prevDir2.current = oldDir2;

    // new heads
    const head1 = { x: oldS1[0].x + newDir1.x, y: oldS1[0].y + newDir1.y };
    const head2 = { x: oldS2[0].x + newDir2.x, y: oldS2[0].y + newDir2.y };

    // eaten?
    const ate1 = head1.x===f.x && head1.y===f.y;
    const ate2 = head2.x===f.x && head2.y===f.y;

    // new bodies
    const newS1 = ate1 ? [head1, ...oldS1] : [head1, ...oldS1.slice(0,-1)];
    const newS2 = ate2 ? [head2, ...oldS2] : [head2, ...oldS2.slice(0,-1)];

    // head-on
    if (head1.x===head2.x && head1.y===head2.y) {
      const moved1 = newDir1.x!==oldDir1.x || newDir1.y!==oldDir1.y;
      const moved2 = newDir2.x!==oldDir2.x || newDir2.y!==oldDir2.y;
      if (moved1 && !moved2) setStatus('Le Serpent 1 a perdu !');
      else if (moved2 && !moved1) setStatus('Le Serpent 2 a perdu !');
      else setStatus('Match nul !');
      setRunning(false);
      return;
    }

    // swap
    const oH1 = oldS1[0], oH2 = oldS2[0];
    if (head1.x===oH2.x && head1.y===oH2.y && head2.x===oH1.x && head2.y===oH1.y) {
      setStatus('Match nul !');
      setRunning(false);
      return;
    }

    // normal collisions
    const b1 = newS1.slice(1), b2 = newS2.slice(1);
    const s1Lose = hitsWall(head1) || b1.some(p=>p.x===head1.x&&p.y===head1.y) || b2.some(p=>p.x===head1.x&&p.y===head1.y);
    const s2Lose = hitsWall(head2) || b2.some(p=>p.x===head2.x&&p.y===head2.y) || b1.some(p=>p.x===head2.x&&p.y===head2.y);
    if (s1Lose && s2Lose) {
      setStatus('Match nul !'); setRunning(false); return;
    } else if (s1Lose) {
      setStatus('Le Serpent 1 a perdu !'); setRunning(false); return;
    } else if (s2Lose) {
      setStatus('Le Serpent 2 a perdu !'); setRunning(false); return;
    }

            // apple eaten? spawn new food and update score
    let newFood = f;
    if (ate1 || ate2) {
      // update score
      setScores(prev => ({
        s1: prev.s1 + (ate1 ? 1 : 0),
        s2: prev.s2 + (ate2 ? 1 : 0)
      }));
      // spawn new apple
      newFood = spawnFood([...newS1, ...newS2]);
      // accelerate
      speedRef.current = Math.max(minSpeed, speedRef.current * decay);
    }

    // apply positions & food
    setSnake1(newS1);
    setSnake2(newS2);
    setFood(newFood);

    scheduleNext();
  }

  useEffect(() => {
    if (running) scheduleNext();
    return () => clearTimeout(loopRef.current);
  }, [running]);

  // render grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const in1 = snake1.some(p=>p.x===r&&p.y===c);
      const in2 = snake2.some(p=>p.x===r&&p.y===c);
      const fCell = food && food.x===r && food.y===c;
      row.push(
        <div key={`${r}-${c}`} style={{
          width:20, height:20,
          backgroundColor: fCell?'red':in1?'green':in2?'blue':'lightgrey',
          border:'1px solid #222'
        }}/>
      );
    }
    grid.push(<div key={r} style={{ display:'flex' }}>{row}</div>);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', height:'100vh' }}>
      <h2>{status || `Scores | Vert: ${scores.s1} Bleu: ${scores.s2}`}</h2>
      <div>{grid}</div>
      {!running && <button onClick={resetGame} style={{ marginTop:16 }}>Restart</button>}
    </div>
  );
}
