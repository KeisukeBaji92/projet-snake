// Directions canoniques
export const DIRS = {
  UP   : { x:-1, y: 0 },
  DOWN : { x: 1, y: 0 },
  LEFT : { x: 0, y:-1 },
  RIGHT: { x: 0, y: 1 },
};

// Avancer un serpent (grow = true => +1 segment)
export function advanceSnake(snake, dir, grow = false) {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  return grow ? [head, ...snake] : [head, ...snake.slice(0, -1)];
}

// Génère l’état initial pour une grille rows × cols
export function makeInitialState(rows = 20, cols = 30) {
  const s1 = [ {x:0,y:4},{x:0,y:3},{x:0,y:2},{x:0,y:1},{x:0,y:0} ];
  const s2 = [
    {x:rows-1,y:cols-5},{x:rows-1,y:cols-4},
    {x:rows-1,y:cols-3},{x:rows-1,y:cols-2},
    {x:rows-1,y:cols-1}
  ];
  return {
    rows, cols,
    snake1: s1,
    snake2: s2,
    food: spawnFood([...s1, ...s2], rows, cols)
  };
}

// Fait apparaître une pomme sur une case libre
export function spawnFood(occupied, rows, cols) {
  while (true) {
    const p = { x: ~~(Math.random()*rows), y: ~~(Math.random()*cols) };
    if (!occupied.some(o => o.x === p.x && o.y === p.y)) return p;
  }
}

// Collision contre les murs
export const hitsWall = ({x,y}, rows, cols) =>
  x < 0 || x >= rows || y < 0 || y >= cols;
