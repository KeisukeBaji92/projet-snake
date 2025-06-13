const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class GameEngine {
  static async simulateMatch(script1, script2) {
    console.log('🎮 Simulation du match en cours...');
    
    const gameState = {
      rows: 20,
      cols: 20,
      snake1: [{ x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 1 }],
      snake2: [{ x: 16, y: 16 }, { x: 16, y: 17 }, { x: 16, y: 18 }],
      dir1: 'right',
      dir2: 'left',
      food: { x: 10, y: 10 },
      score1: 0,
      score2: 0,
      gameOver: false,
      winner: null,
      turn: 0,
      replay: []
    };

    const maxTurns = 1000;
    
    while (!gameState.gameOver && gameState.turn < maxTurns) {
      // Obtenir les actions des deux scripts
      const action1 = await this.getScriptAction(script1, this.createGameData(gameState, 1));
      const action2 = await this.getScriptAction(script2, this.createGameData(gameState, 2));
      
      // Valider et sécuriser les directions
      gameState.dir1 = this.validateDirection(action1, gameState.dir1);
      gameState.dir2 = this.validateDirection(action2, gameState.dir2);
      
      // Enregistrer l'action pour le replay
      gameState.replay.push({
        turn: gameState.turn,
        snake1Move: gameState.dir1,
        snake2Move: gameState.dir2,
        snake1: [...gameState.snake1],
        snake2: [...gameState.snake2],
        food: { ...gameState.food },
        score1: gameState.score1,
        score2: gameState.score2
      });
      
      // Déplacer les serpents
      this.moveSnake(gameState.snake1, gameState.dir1);
      this.moveSnake(gameState.snake2, gameState.dir2);
      
      // Gérer les collisions et la nourriture
      this.handleCollisions(gameState);
      
      gameState.turn++;
    }
    
    // Si aucun gagnant défini par les collisions, déterminer par score
    if (!gameState.gameOver) {
      // Timeout atteint, le plus grand score gagne
      if (gameState.score1 > gameState.score2) {
        gameState.winner = 'script1';
      } else if (gameState.score2 > gameState.score1) {
        gameState.winner = 'script2';
      } else {
        gameState.winner = 'draw';
      }
    }
    
    return {
      winner: gameState.winner,
      finalScores: { red: gameState.score1, blue: gameState.score2 },
      moves: gameState.turn,
      duration: gameState.turn * 200, // 200ms par tour
      replay: gameState.replay,
      finalState: {
        snake1: gameState.snake1,
        snake2: gameState.snake2,
        food: gameState.food
      }
    };
  }
  
  static createGameData(gameState, playerNumber) {
    const mySnake = playerNumber === 1 ? gameState.snake1 : gameState.snake2;
    const enemySnake = playerNumber === 1 ? gameState.snake2 : gameState.snake1;
    const myDirection = playerNumber === 1 ? gameState.dir1 : gameState.dir2;

      return {
      my_snake: {
        head: mySnake[0],
        body: mySnake,
        direction: myDirection
      },
      enemy_snake: {
        head: enemySnake[0],
        body: enemySnake,
        direction: playerNumber === 1 ? gameState.dir2 : gameState.dir1
      },
        food: gameState.food,
      grid_size: { rows: gameState.rows, cols: gameState.cols },
      turn: gameState.turn
    };
  }
  
  static async getScriptAction(script, gameData) {
    try {
      if (!script.code) {
        return 'right'; // Direction par défaut
      }
      
      // Écrire le script temporairement
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const scriptPath = path.join(tempDir, `script_${script._id}.py`);
      await fs.writeFile(scriptPath, script.code);
      
      // Exécuter le script avec les données du jeu
      const result = await this.executeScript(scriptPath, gameData);
      
      // Nettoyer
      await fs.unlink(scriptPath).catch(() => {});
      
      return result;
    } catch (error) {
      console.error('Erreur script:', error);
      return 'right'; // Direction par défaut en cas d'erreur
    }
  }
  
  static executeScript(scriptPath, gameData) {
    return new Promise((resolve) => {
      const command = `python "${scriptPath}"`;
      const child = exec(command, { timeout: 1000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Erreur exécution script:', error);
          resolve('right');
          return;
        }
        
        try {
          const response = JSON.parse(stdout.trim());
          resolve(response.action || 'right');
        } catch (parseError) {
          console.error('Erreur parsing réponse script:', parseError);
          resolve('right');
        }
      });
      
      // Envoyer les données du jeu au script
      child.stdin.write(JSON.stringify(gameData));
      child.stdin.end();
    });
  }
  
  static validateDirection(direction, currentDirection) {
    const validDirections = ['up', 'down', 'left', 'right'];
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    
    // Si direction invalide, garder la direction courante
    if (!validDirections.includes(direction)) {
      return currentDirection;
    }
    
    // Empêcher le retour sur soi-même
    if (direction === opposites[currentDirection]) {
      return currentDirection;
    }
    
    return direction;
  }
  
  static moveSnake(snake, direction) {
    const head = { ...snake[0] };
    
    switch (direction) {
      case 'up': head.x -= 1; break;
      case 'down': head.x += 1; break;
      case 'left': head.y -= 1; break;
      case 'right': head.y += 1; break;
    }
    
    snake.unshift(head);
  }
  
  static handleCollisions(gameState) {
    const { rows, cols } = gameState;
    const head1 = gameState.snake1[0];
    const head2 = gameState.snake2[0];
    
    // Vérifier si les serpents mangent la nourriture
    let foodEaten = false;
    
    if (head1.x === gameState.food.x && head1.y === gameState.food.y) {
      gameState.score1++;
      foodEaten = true;
    } else {
      gameState.snake1.pop();
    }
    
    if (head2.x === gameState.food.x && head2.y === gameState.food.y) {
      gameState.score2++;
      foodEaten = true;
    } else {
      gameState.snake2.pop();
    }
    
    // Placer nouvelle nourriture si mangée
    if (foodEaten) {
      this.placeFood(gameState);
    }
    
    // Vérifier les collisions fatales
    const snake1Dead = this.isSnakeDead(gameState.snake1, gameState.snake2, rows, cols);
    const snake2Dead = this.isSnakeDead(gameState.snake2, gameState.snake1, rows, cols);
    
    // Gérer les collisions selon les vraies règles du jeu
    if (head1.x === head2.x && head1.y === head2.y) {
      // Collision frontale directe = les deux meurent
      gameState.gameOver = true;
      if (gameState.score1 > gameState.score2) {
        gameState.winner = 'script1';
      } else if (gameState.score2 > gameState.score1) {
        gameState.winner = 'script2'; 
      } else {
        gameState.winner = 'draw';
      }
    } else if (snake1Dead && snake2Dead) {
      // Les deux serpents meurent = victoire au score
      gameState.gameOver = true;
      if (gameState.score1 > gameState.score2) {
        gameState.winner = 'script1';
      } else if (gameState.score2 > gameState.score1) {
        gameState.winner = 'script2';
      } else {
        gameState.winner = 'draw';
      }
    } else if (snake1Dead) {
      // Serpent 1 meurt = serpent 2 gagne automatiquement
      gameState.gameOver = true;
      gameState.winner = 'script2';
    } else if (snake2Dead) {
      // Serpent 2 meurt = serpent 1 gagne automatiquement
      gameState.gameOver = true;
      gameState.winner = 'script1';
    }
  }
  
  static isSnakeDead(snake, otherSnake, rows, cols) {
    const head = snake[0];
    
    // Collision avec les murs
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
      return true;
    }
    
    // Collision avec son propre corps
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    // Collision avec l'autre serpent
    for (let i = 0; i < otherSnake.length; i++) {
      if (head.x === otherSnake[i].x && head.y === otherSnake[i].y) {
        return true;
      }
    }
    
    return false;
  }
  
  static placeFood(gameState) {
    const occupied = new Set();
    
    // Marquer toutes les positions occupées
    [...gameState.snake1, ...gameState.snake2].forEach(segment => {
      occupied.add(`${segment.x},${segment.y}`);
    });
    
    // Trouver une position libre
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * gameState.rows),
        y: Math.floor(Math.random() * gameState.cols)
      };
    } while (occupied.has(`${food.x},${food.y}`));
    
    gameState.food = food;
  }
}

module.exports = GameEngine; 