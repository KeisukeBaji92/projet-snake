// Script simple par défaut
export const defaultScript = `function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}`;

// Script défensif par défaut
export const defaultScript2 = `function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  const enemy = state.you[0];
  
  // Éviter les collisions avec les murs
  if (head.x === 0) return 'right';
  if (head.x === state.rows - 1) return 'left';
  if (head.y === 0) return 'down';
  if (head.y === state.cols - 1) return 'up';
  
  // Sinon, suivre la nourriture
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}`;

// Script baladeur qui se concentre sur la survie
export const scriptBaladeur = `function nextMove(state) {
  const head = state.me[0];
  const body = state.me;
  const enemy = state.you;
  
  // Liste des directions possibles
  const directions = ['up', 'down', 'left', 'right'];
  
  // Fonction pour obtenir la prochaine position selon une direction
  function getNextPos(dir) {
    if (dir === 'up') return {x: head.x - 1, y: head.y};
    if (dir === 'down') return {x: head.x + 1, y: head.y};
    if (dir === 'left') return {x: head.x, y: head.y - 1};
    return {x: head.x, y: head.y + 1};
  }
  
  // Vérifie si une position est sûre
  function isSafe(pos) {
    // Vérifier les murs
    if (pos.x < 0 || pos.x >= state.rows || pos.y < 0 || pos.y >= state.cols) {
      return false;
    }
    
    // Vérifier les collisions avec notre corps
    for (let part of body) {
      if (part.x === pos.x && part.y === pos.y) {
        return false;
      }
    }
    
    // Vérifier les collisions avec l'ennemi
    for (let part of enemy) {
      if (part.x === pos.x && part.y === pos.y) {
        return false;
      }
    }
    
    return true;
  }
  
  // Trouver toutes les directions sûres
  const safeDirections = directions.filter(dir => isSafe(getNextPos(dir)));
  
  // S'il n'y a aucune direction sûre, continuer tout droit
  if (safeDirections.length === 0) {
    return 'right';
  }
  
  // Choisir une direction aléatoire parmi les directions sûres
  // mais avec une préférence pour garder la même direction si possible
  const lastDir = state.lastDir || 'right';
  if (safeDirections.includes(lastDir) && Math.random() < 0.7) {
    return lastDir;
  }
  
  // Sinon, choisir une direction aléatoire
  const randomIndex = Math.floor(Math.random() * safeDirections.length);
  return safeDirections[randomIndex];
}`; 