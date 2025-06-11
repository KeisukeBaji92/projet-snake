// Script simple par défaut - maintenant évite les bombes
export const defaultScript = `function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  const bombs = state.bombs || [];
  
  // Fonction pour vérifier si une position contient une bombe
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
    if (nextX < 0 || nextX >= state.rows || nextY < 0 || nextY >= state.cols) {
      return false;
    }
    
    // Vérifier les bombes
    if (isBomb(nextX, nextY)) {
      return false;
    }
    
    // Vérifier les collisions avec les serpents
    const allSnakeParts = [...state.me, ...(state.you || [])];
    for (let part of allSnakeParts) {
      if (part.x === nextX && part.y === nextY) {
        return false;
      }
    }
    
    return true;
  }
  
  // Si on a de la nourriture visible, essayer d'aller vers elle
  if (food) {
    if (food.y < head.y && isSafe('left')) return 'left';
    if (food.y > head.y && isSafe('right')) return 'right';
    if (food.x < head.x && isSafe('up')) return 'up';
    if (food.x > head.x && isSafe('down')) return 'down';
  }
  
  // Sinon, trouver une direction sûre
  const directions = ['up', 'down', 'left', 'right'];
  const safeDirections = directions.filter(dir => isSafe(dir));
  
  if (safeDirections.length > 0) {
    return safeDirections[0];
  }
  
  // Si aucune direction n'est sûre, essayer de survivre
  return 'right';
}`;

// Script défensif par défaut - maintenant évite les bombes
export const defaultScript2 = `function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  const enemy = state.you && state.you.length > 0 ? state.you[0] : null;
  const bombs = state.bombs || [];
  
  // Fonction pour vérifier si une position contient une bombe
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
    if (nextX < 0 || nextX >= state.rows || nextY < 0 || nextY >= state.cols) {
      return false;
    }
    
    // Vérifier les bombes
    if (isBomb(nextX, nextY)) {
      return false;
    }
    
    // Vérifier les collisions avec les serpents
    const allSnakeParts = [...state.me, ...(state.you || [])];
    for (let part of allSnakeParts) {
      if (part.x === nextX && part.y === nextY) {
        return false;
      }
    }
    
    return true;
  }
  
  // Éviter les bords si possible
  const directions = ['up', 'down', 'left', 'right'];
  const safeDirections = directions.filter(dir => isSafe(dir));
  
  // Si près du bord, essayer de s'éloigner
  if (head.x <= 1 && safeDirections.includes('down')) return 'down';
  if (head.x >= state.rows - 2 && safeDirections.includes('up')) return 'up';
  if (head.y <= 1 && safeDirections.includes('right')) return 'right';
  if (head.y >= state.cols - 2 && safeDirections.includes('left')) return 'left';
  
  // Si on a de la nourriture visible, essayer d'aller vers elle
  if (food) {
    if (food.y < head.y && safeDirections.includes('left')) return 'left';
    if (food.y > head.y && safeDirections.includes('right')) return 'right';
    if (food.x < head.x && safeDirections.includes('up')) return 'up';
    if (food.x > head.x && safeDirections.includes('down')) return 'down';
  }
  
  // Sinon, prendre une direction sûre
  if (safeDirections.length > 0) {
    return safeDirections[Math.floor(Math.random() * safeDirections.length)];
  }
  
  return 'right';
}`;

// Script baladeur qui se concentre sur la survie - maintenant évite les bombes
export const scriptBaladeur = `function nextMove(state) {
  const head = state.me[0];
  const body = state.me;
  const enemy = state.you || [];
  const bombs = state.bombs || [];
  
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
    
    // Vérifier les bombes
    for (let bomb of bombs) {
      if (bomb.x === pos.x && bomb.y === pos.y) {
        return false;
      }
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