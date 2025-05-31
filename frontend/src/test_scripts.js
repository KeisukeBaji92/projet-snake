// Script 1 : Suiveur de nourriture simple
const scriptSimple = `
// Script simple qui suit la nourriture
function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  
  // Déplacement horizontal d'abord
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  
  // Puis vertical
  if (food.x < head.x) return 'up';
  if (food.x > head.x) return 'down';
  
  return 'right';
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
  return [...state.me.slice(1), ...state.you].some(p => 
    p.x === pos.x && p.y === pos.y
  );
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
  
  // Choisir la direction la plus proche de la nourriture
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
`;

// Script 3 : Stratégie agressive
const scriptAgressif = `
// Fonction principale
function nextMove(state) {
  const head = state.me[0];
  const enemyHead = state.you[0];
  const food = state.food;
  
  // Calcul des distances
  const distMeFood = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
  const distEnemyFood = Math.abs(enemyHead.x - food.x) + Math.abs(enemyHead.y - food.y);
  
  // Si on est plus près de la nourriture
  if (distMeFood <= distEnemyFood) {
    if (food.y < head.y) return 'left';
    if (food.y > head.y) return 'right';
    if (food.x < head.x) return 'up';
    if (food.x > head.x) return 'down';
  }
  
  // Sinon, on essaie d'intercepter l'adversaire
  const distToEnemy = Math.abs(head.x - enemyHead.x) + Math.abs(head.y - enemyHead.y);
  if (distToEnemy <= 2) {
    if (enemyHead.y < head.y) return 'left';
    if (enemyHead.y > head.y) return 'right';
    if (enemyHead.x < head.x) return 'up';
    return 'down';
  }
  
  // Par défaut, on suit la nourriture
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}
`;

// Export des scripts sous forme de chaînes de caractères
window.scriptSimple = scriptSimple;
window.scriptDefensif = scriptDefensif;
window.scriptAgressif = scriptAgressif; 