import React, { useState, useEffect, useRef } from 'react';

export default function SnakeBoard({ rows = 20, cols = 30 }) {
  /*── Directions (refs) ──*/
  const dir1 = useRef({ x: 0, y: 1 });
  const dir2 = useRef({ x: 0, y: -1 });
  const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

  /*── Vitesse fluide (refs) ──*/
  const initialSpeed = 200;
  const speedRef     = useRef(initialSpeed);
  const loopIdRef    = useRef(null);
  const minSpeed     = 60;
  const decay        = 0.95;

  /*── État React (affichage) ──*/
  const [snake1, setSnake1] = useState([]);
  const [snake2, setSnake2] = useState([]);
  const [food,   setFood]   = useState(null);
  const [scores, setScores] = useState({ s1: 0, s2: 0 });
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);

  /*── Refs synchronisées avec l’état pour la boucle ──*/
  const s1Ref = useRef(snake1);
  const s2Ref = useRef(snake2);
  const foodRef = useRef(food);
  useEffect(() => { s1Ref.current = snake1;   }, [snake1]);
  useEffect(() => { s2Ref.current = snake2;   }, [snake2]);
  useEffect(() => { foodRef.current = food;   }, [food]);

  /*── Helpers purs ──*/
  const posKey   = ({ x, y }) => `${x},${y}`;
  const hitsWall = ({ x, y }) => x < 0 || x >= rows || y < 0 || y >= cols;
  const advance  = (snake, dir, grow = false) => {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    return grow ? [head, ...snake] : [head, ...snake.slice(0, -1)];
  };
  const spawnFood = (occupied) => {
    while (true) {
      const p = { x: ~~(Math.random()*rows), y: ~~(Math.random()*cols) };
      if (!occupied.some(s => s.x === p.x && s.y === p.y)) return p;
    }
  };

  /*── Init / restart ──*/
  const resetGame = () => {
    const s1 = [ {x:0,y:4},{x:0,y:3},{x:0,y:2},{x:0,y:1},{x:0,y:0} ];
    const s2 = [
      {x:rows-1,y:cols-5},{x:rows-1,y:cols-4},
      {x:rows-1,y:cols-3},{x:rows-1,y:cols-2},
      {x:rows-1,y:cols-1},
    ];
    setSnake1(s1);  setSnake2(s2);
    const f = spawnFood([...s1, ...s2]);
    setFood(f);
    setScores({ s1:0, s2:0 });
    setStatus('');
    s1Ref.current = s1;  s2Ref.current = s2; foodRef.current = f;
    dir1.current = {x:0,y:1}; dir2.current = {x:0,y:-1};
    speedRef.current = initialSpeed;
    clearTimeout(loopIdRef.current);
    setRunning(true);
  };
  useEffect(resetGame, []);             // première partie auto

  /*── Clavier ──*/
  useEffect(() => {
    const onKey = ({key}) => {
      /* flèches */
      if (key==='ArrowUp'   && !isOpposite(dir1.current,{x:-1,y:0})) dir1.current={x:-1,y:0};
      if (key==='ArrowDown' && !isOpposite(dir1.current,{x:1,y:0}))  dir1.current={x:1,y:0};
      if (key==='ArrowLeft' && !isOpposite(dir1.current,{x:0,y:-1})) dir1.current={x:0,y:-1};
      if (key==='ArrowRight'&& !isOpposite(dir1.current,{x:0,y:1}))  dir1.current={x:0,y:1};
      /* wasd */
      if (key==='w' && !isOpposite(dir2.current,{x:-1,y:0})) dir2.current={x:-1,y:0};
      if (key==='s' && !isOpposite(dir2.current,{x:1,y:0}))  dir2.current={x:1,y:0};
      if (key==='a' && !isOpposite(dir2.current,{x:0,y:-1})) dir2.current={x:0,y:-1};
      if (key==='d' && !isOpposite(dir2.current,{x:0,y:1}))  dir2.current={x:0,y:1};
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /*── Boucle de jeu ──*/
  const scheduleNext = () => {
    loopIdRef.current = setTimeout(gameTick, speedRef.current);
  };

  const gameTick = () => {
    if (!running) return;

    /* états courants au moment T */
    const s1 = s1Ref.current, s2 = s2Ref.current, f = foodRef.current;

    /* 1. prochain head */
    const head1 = { x: s1[0].x + dir1.current.x, y: s1[0].y + dir1.current.y };
    const head2 = { x: s2[0].x + dir2.current.x, y: s2[0].y + dir2.current.y };

    /* 2. sets corps pour lookup */
    const body1 = new Set(s1.slice(1).map(posKey));
    const body2 = new Set(s2.slice(1).map(posKey));

    /* 3. collisions */
    const headOnHead = head1.x===head2.x && head1.y===head2.y;
    const s1Lose = hitsWall(head1)||body1.has(posKey(head1))||body2.has(posKey(head1));
    const s2Lose = hitsWall(head2)||body2.has(posKey(head2))||body1.has(posKey(head2));

    if (headOnHead || (s1Lose && s2Lose)) { setStatus('Match nul !'); setRunning(false); return; }
    if (s1Lose) { setStatus('Le Serpent 1 a perdu !'); setRunning(false); return; }
    if (s2Lose) { setStatus('Le Serpent 2 a perdu !'); setRunning(false); return; }

    /* 4. pomme ? */
    const ate1 = head1.x===f.x && head1.y===f.y;
    const ate2 = head2.x===f.x && head2.y===f.y;
    let newFood = f, newScores = {...scores};
    if (ate1 || ate2) {
      newFood = spawnFood([...s1, ...s2, head1, head2]);
      if (ate1) { newScores.s1++; speedRef.current=Math.max(minSpeed,speedRef.current*decay); }
      if (ate2) { newScores.s2++; speedRef.current=Math.max(minSpeed,speedRef.current*decay); }
    }

    /* 5. construction des nouveaux serpents */
    const newS1 = ate1 ? [head1, ...s1] : [head1, ...s1.slice(0,-1)];
    const newS2 = ate2 ? [head2, ...s2] : [head2, ...s2.slice(0,-1)];

    /* 6. mise à jour état + refs */
    setSnake1(newS1); s1Ref.current = newS1;
    setSnake2(newS2); s2Ref.current = newS2;
    setFood(newFood); foodRef.current = newFood;
    setScores(newScores);

    /* 7. prochaine frame */
    scheduleNext();
  };

  /* démarrer / stopper la boucle suivant `running` */
  useEffect(() => { if (running) scheduleNext();
    return () => clearTimeout(loopIdRef.current);
  }, [running]);

  /*── Rendu ──*/
  const grid = [];
  for (let r=0;r<rows;r++){
    const row=[];
    for (let c=0;c<cols;c++){
      const in1=snake1.some(s=>s.x===r&&s.y===c);
      const in2=snake2.some(s=>s.x===r&&s.y===c);
      const isFood=food&&food.x===r&&food.y===c;
      row.push(<div key={`${r}-${c}`} style={{
        width:20,height:20,
        backgroundColor:isFood?'red':in1?'green':in2?'blue':'lightgrey',
        border:'1px solid #222'
      }}/>);
    }
    grid.push(<div key={r} style={{display:'flex'}}>{row}</div>);
  }

  return (
    <div style={{display:'flex',flexDirection:'column',
                 justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <h2>{status || `Scores | Vert : ${scores.s1}  Bleu : ${scores.s2}`}</h2>
      <div>{grid}</div>
      {!running && <button style={{marginTop:16}} onClick={resetGame}>Restart</button>}
    </div>
  );
}
