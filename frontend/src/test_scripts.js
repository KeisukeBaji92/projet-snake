// Script 1 : Suiveur de nourriture simple
const scriptSimple = `
// Script simple qui suit la nourriture et évite les bombes
function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  const bombs = state.bombs || [];
  
  // Fonction pour vérifier si une position est une bombe
  function isBomb(x, y) {
    return bombs.some(bomb => bomb.x === x && bomb.y === y);
  }
  
  // Fonction pour vérifier si une direction est sûre
  function isSafe(dir) {
    let nextX = head.x, nextY = head.y;
    if (dir === 'up') nextX--;
    else if (dir === 'down') nextX++;
    else if (dir === 'left') nextY--;
    else if (dir === 'right') nextY++;
    
    // Vérifier les murs
    if (nextX < 0 || nextX >= state.rows || nextY < 0 || nextY >= state.cols) return false;
    
    // Vérifier les bombes
    if (isBomb(nextX, nextY)) return false;
    
    // Vérifier les serpents
    const allParts = [...state.me, ...(state.you || [])];
    return !allParts.some(p => p.x === nextX && p.y === nextY);
  }
  
  // Si on a de la nourriture, essayer d'aller vers elle en sécurité
  if (food) {
    if (food.y < head.y && isSafe('left')) return 'left';
    if (food.y > head.y && isSafe('right')) return 'right';
    if (food.x < head.x && isSafe('up')) return 'up';
    if (food.x > head.x && isSafe('down')) return 'down';
  }
  
  // Trouver une direction sûre
  const dirs = ['up', 'down', 'left', 'right'];
  const safeDirs = dirs.filter(dir => isSafe(dir));
  
  return safeDirs.length > 0 ? safeDirs[0] : 'right';
}
`;

// Script 2 : Stratégie défensive
const scriptDefensif = `
// Fonctions utilitaires
function getNextPos(pos, dir) {
  if (dir === 'up') return {x: pos.x - 1, y: pos.y};
  if (dir === 'down') return {x: pos.x + 1, y: pos.y};
  if (dir === 'left') return {x: pos.x, y: pos.y - 1};
  if (dir === 'right') return {x: pos.x, y: pos.y + 1};
}

function isValid(pos, state) {
  return pos.x >= 0 && pos.x < state.rows && 
         pos.y >= 0 && pos.y < state.cols;
}

function willCollide(pos, state) {
  // Vérifier collisions avec serpents
  const collision = [...state.me.slice(1), ...(state.you || [])].some(p => 
    p.x === pos.x && p.y === pos.y
  );
  
  // Vérifier collisions avec bombes
  const bombs = state.bombs || [];
  const bombCollision = bombs.some(bomb => bomb.x === pos.x && bomb.y === pos.y);
  
  return collision || bombCollision;
}

// Fonction principale
function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  
  // Vérifier les directions possibles
  const dirs = ['up', 'down', 'left', 'right'];
  const safe = [];
  
  for (const dir of dirs) {
    const next = getNextPos(head, dir);
    if (isValid(next, state) && !willCollide(next, state)) {
      safe.push(dir);
    }
  }
  
  if (safe.length === 0) return 'right';
  
  // Si on a de la nourriture visible, choisir la direction la plus proche
  if (food) {
    let bestDir = safe[0];
    let bestDist = Infinity;
    
    for (const dir of safe) {
      const pos = getNextPos(head, dir);
      const dist = Math.abs(pos.x - food.x) + Math.abs(pos.y - food.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    }
    
    return bestDir;
  }
  
  // Sinon prendre une direction sûre aléatoire
  return safe[Math.floor(Math.random() * safe.length)];
}
`;

// Script 3 : Stratégie agressive
const scriptAgressif = `
// Fonction principale
function nextMove(state) {
  const head = state.me[0];
  const enemyHead = state.you && state.you.length > 0 ? state.you[0] : null;
  const food = state.food;
  const bombs = state.bombs || [];
  
  // Fonction pour vérifier si une direction est sûre
  function isSafe(dir) {
    let nextX = head.x, nextY = head.y;
    if (dir === 'up') nextX--;
    else if (dir === 'down') nextX++;
    else if (dir === 'left') nextY--;
    else if (dir === 'right') nextY++;
    
    // Vérifier les murs
    if (nextX < 0 || nextX >= state.rows || nextY < 0 || nextY >= state.cols) return false;
    
    // Vérifier les bombes
    if (bombs.some(bomb => bomb.x === nextX && bomb.y === nextY)) return false;
    
    // Vérifier les serpents
    const allParts = [...state.me, ...(state.you || [])];
    return !allParts.some(p => p.x === nextX && p.y === nextY);
  }
  
  // Trouver les directions sûres
  const dirs = ['up', 'down', 'left', 'right'];
  const safeDirs = dirs.filter(dir => isSafe(dir));
  
  if (safeDirs.length === 0) return 'right';
  
  // Si on a la nourriture et l'ennemi visible
  if (food && enemyHead) {
    const distMeFood = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
    const distEnemyFood = Math.abs(enemyHead.x - food.x) + Math.abs(enemyHead.y - food.y);
    
    // Si on est plus près de la nourriture, aller vers elle
    if (distMeFood <= distEnemyFood) {
      if (food.y < head.y && safeDirs.includes('left')) return 'left';
      if (food.y > head.y && safeDirs.includes('right')) return 'right';
      if (food.x < head.x && safeDirs.includes('up')) return 'up';
      if (food.x > head.x && safeDirs.includes('down')) return 'down';
    }
    
    // Sinon, essayer d'intercepter l'adversaire
    const distToEnemy = Math.abs(head.x - enemyHead.x) + Math.abs(head.y - enemyHead.y);
    if (distToEnemy <= 2) {
      if (enemyHead.y < head.y && safeDirs.includes('left')) return 'left';
      if (enemyHead.y > head.y && safeDirs.includes('right')) return 'right';
      if (enemyHead.x < head.x && safeDirs.includes('up')) return 'up';
      if (safeDirs.includes('down')) return 'down';
    }
  }
  
  // Par défaut, suivre la nourriture si visible
  if (food) {
    if (food.y < head.y && safeDirs.includes('left')) return 'left';
    if (food.y > head.y && safeDirs.includes('right')) return 'right';
    if (food.x < head.x && safeDirs.includes('up')) return 'up';
    if (food.x > head.x && safeDirs.includes('down')) return 'down';
  }
  
  // Sinon, direction sûre aléatoire
  return safeDirs[Math.floor(Math.random() * safeDirs.length)];
}
`;

// Export des scripts sous forme de chaînes de caractères
window.scriptSimple = scriptSimple;
window.scriptDefensif = scriptDefensif;
window.scriptAgressif = scriptAgressif; 