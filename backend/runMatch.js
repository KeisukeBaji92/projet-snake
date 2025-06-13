// backend/runMatch.js
const { spawnSync } = require('child_process');
const fs = require('fs');

const [script1Path, script2Path, difficulty] = process.argv.slice(2);

function runMatch() {
  // Exécuter les deux scripts en parallèle
  const bot1 = spawnSync('python3', [script1Path], { 
    encoding: 'utf-8',
    timeout: 5000 
  });
  
  const bot2 = spawnSync('python3', [script2Path], { 
    encoding: 'utf-8',
    timeout: 5000 
  });

  if (bot1.error || bot2.error) {
    throw new Error(bot1.error?.message || bot2.error?.message);
  }

  // Simuler le match (simplifié)
  const result = {
    winner: Math.random() > 0.5 ? 'snake1' : 'snake2',
    scores: {
      snake1: Math.floor(Math.random() * 10),
      snake2: Math.floor(Math.random() * 10)
    },
    frames: generateFrames(),
    reason: 'Fin normale du match',
    rows: 20,
    cols: 20
  };

  console.log(JSON.stringify(result));
}

function generateFrames() {
  const frames = [];
  const snake1 = [{x: 3, y: 3}, {x: 3, y: 2}, {x: 3, y: 1}];
  const snake2 = [{x: 16, y: 16}, {x: 16, y: 17}, {x: 16, y: 18}];
  const food = {x: 10, y: 10};

  for (let i = 0; i < 50; i++) {
    // Mouvement simplifié
    snake1.unshift({
      x: snake1[0].x + (Math.random() > 0.5 ? 1 : 0),
      y: snake1[0].y + (Math.random() > 0.5 ? 1 : 0)
    });
    snake1.pop();

    snake2.unshift({
      x: snake2[0].x + (Math.random() > 0.5 ? -1 : 0),
      y: snake2[0].y + (Math.random() > 0.5 ? -1 : 0)
    });
    snake2.pop();

    frames.push({
      snake1: [...snake1],
      snake2: [...snake2],
      food: {...food}
    });
  }

  return frames;
}

try {
  runMatch();
} catch (error) {
  console.error(JSON.stringify({
    error: error.message,
    winner: null,
    scores: { snake1: 0, snake2: 0 },
    frames: [],
    reason: 'Erreur lors du match'
  }));
}