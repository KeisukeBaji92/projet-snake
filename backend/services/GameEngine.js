const { VM } = require('vm2');

class GameEngine {
  constructor(settings = {}) {
    this.settings = {
      rows: settings.rows || 20,
      cols: settings.cols || 20,
      maxRounds: settings.maxRounds || 1000,
      timeoutMs: settings.timeoutMs || 1000, // Timeout par mouvement
      difficulty: settings.difficulty || 'normal',
      ...settings
    };
    
    this.seed = settings.seed || Math.floor(Math.random() * 1000000);
    this.random = this.createSeededRandom(this.seed);
  }

  // Générateur aléatoire avec seed pour des résultats reproductibles
  createSeededRandom(seed) {
    let current = seed;
    return () => {
      current = (current * 1103515245 + 12345) & 0x7fffffff;
      return current / 0x7fffffff;
    };
  }

  // Initialiser l'état du jeu
  initializeGame() {
    const state = {
      snake1: [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 3, y: 5 }
      ],
      snake2: [
        { x: this.settings.rows - 4, y: this.settings.cols - 4 },
        { x: this.settings.rows - 4, y: this.settings.cols - 5 },
        { x: this.settings.rows - 4, y: this.settings.cols - 6 }
      ],
      dir1: 'right',
      dir2: 'left',
      score1: 0,
      score2: 0,
      food: null,
      bombs: this.settings.difficulty === 'hard' ? this.generateBombs() : [],
      gameOver: false,
      winner: null,
      round: 0
    };

    // Créer la nourriture initiale
    state.food = this.generateFood([...state.snake1, ...state.snake2]);
    
    return state;
  }

  // Générer une position de nourriture
  generateFood(occupiedPositions) {
    const free = [];
    for (let x = 0; x < this.settings.rows; x++) {
      for (let y = 0; y < this.settings.cols; y++) {
        if (!occupiedPositions.some(pos => pos.x === x && pos.y === y)) {
          free.push({ x, y });
        }
      }
    }
    return free[Math.floor(this.random() * free.length)];
  }

  // Générer les bombes pour le mode difficile
  generateBombs() {
    const bombs = [];
    const occupiedPositions = [
      { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 },
      { x: this.settings.rows - 4, y: this.settings.cols - 4 },
      { x: this.settings.rows - 4, y: this.settings.cols - 5 },
      { x: this.settings.rows - 4, y: this.settings.cols - 6 }
    ];

    while (bombs.length < 4) {
      const bomb = {
        x: Math.floor(this.random() * this.settings.rows),
        y: Math.floor(this.random() * this.settings.cols)
      };
      
      if (!occupiedPositions.some(pos => pos.x === bomb.x && pos.y === bomb.y) &&
          !bombs.some(b => b.x === bomb.x && b.y === bomb.y)) {
        bombs.push(bomb);
      }
    }
    
    return bombs;
  }

  // Créer l'état de jeu pour un script avec vision limitée
  createScriptState(gameState, isSnake1) {
    const head = isSnake1 ? gameState.snake1[0] : gameState.snake2[0];
    const mySnake = isSnake1 ? gameState.snake1 : gameState.snake2;
    const enemySnake = isSnake1 ? gameState.snake2 : gameState.snake1;

    if (this.settings.difficulty === 'hard') {
      const VISION_RANGE = 3;
      
      const isVisible = (pos) => {
        const distance = Math.max(Math.abs(pos.x - head.x), Math.abs(pos.y - head.y));
        return distance <= VISION_RANGE;
      };

      return {
        me: mySnake.filter(segment => isVisible(segment)),
        opponent: enemySnake.filter(segment => isVisible(segment)),
        you: enemySnake.filter(segment => isVisible(segment)),
        food: isVisible(gameState.food) ? gameState.food : null,
        bombs: gameState.bombs.filter(bomb => isVisible(bomb)),
        score: {
          me: isSnake1 ? gameState.score1 : gameState.score2,
          opponent: isSnake1 ? gameState.score2 : gameState.score1
        },
        difficulty: 'hard',
        rows: this.settings.rows,
        cols: this.settings.cols
      };
    } else {
      return {
        me: mySnake,
        opponent: enemySnake,
        you: enemySnake,
        food: gameState.food,
        bombs: [],
        score: {
          me: isSnake1 ? gameState.score1 : gameState.score2,
          opponent: isSnake1 ? gameState.score2 : gameState.score1
        },
        difficulty: 'normal',
        rows: this.settings.rows,
        cols: this.settings.cols
      };
    }
  }

  // Exécuter un script de manière sécurisée
  executeScript(scriptCode, gameState, timeoutMs = 1000) {
    try {
      const vm = new VM({
        timeout: timeoutMs,
        sandbox: {
          state: gameState,
          console: {
            log: () => {} // Désactiver console.log dans les scripts
          }
        }
      });

      // Wrapper pour exécuter la fonction nextMove
      const wrappedCode = `
        ${scriptCode}
        
        if (typeof nextMove === 'function') {
          nextMove(state);
        } else {
          throw new Error('Function nextMove not found');
        }
      `;

      const result = vm.run(wrappedCode);
      
      // Valider le mouvement
      if (!['up', 'down', 'left', 'right'].includes(result)) {
        return 'right'; // Mouvement par défaut
      }
      
      return result;
    } catch (error) {
      console.error('Script execution error:', error.message);
      return 'right'; // Mouvement par défaut en cas d'erreur
    }
  }

  // Appliquer un mouvement à un serpent
  moveSnake(snake, direction) {
    const directions = {
      up: { x: -1, y: 0 },
      down: { x: 1, y: 0 },
      left: { x: 0, y: -1 },
      right: { x: 0, y: 1 }
    };

    const head = { ...snake[0] };
    const delta = directions[direction];
    head.x += delta.x;
    head.y += delta.y;

    return [head, ...snake];
  }

  // Vérifier les collisions
  checkCollisions(gameState) {
    const { snake1, snake2, food, bombs } = gameState;
    const head1 = snake1[0];
    const head2 = snake2[0];

    // Collision avec les murs
    const isOutOfBounds = (head) => 
      head.x < 0 || head.x >= this.settings.rows || 
      head.y < 0 || head.y >= this.settings.cols;

    // Collision avec les bombes
    const hitsBomb = (head) => 
      this.settings.difficulty === 'hard' && 
      bombs.some(bomb => bomb.x === head.x && bomb.y === head.y);

    // Collision avec soi-même
    const hitsOwnBody = (head, snake) => 
      snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

    // Collision avec l'autre serpent
    const hitsOtherSnake = (head, otherSnake) =>
      otherSnake.some(segment => segment.x === head.x && segment.y === head.y);

    // Collision frontale
    const headCollision = head1.x === head2.x && head1.y === head2.y;

    let result = { gameOver: false, events: [] };

    // Vérifier la nourriture d'abord
    let ate1 = false, ate2 = false;
    
    if (head1.x === food.x && head1.y === food.y) {
      ate1 = true;
      gameState.score1++;
      result.events.push({
        type: 'food_eaten',
        snake: 'snake1',
        position: { x: head1.x, y: head1.y }
      });
    }
    
    if (head2.x === food.x && head2.y === food.y) {
      ate2 = true;
      gameState.score2++;
      result.events.push({
        type: 'food_eaten',
        snake: 'snake2',
        position: { x: head2.x, y: head2.y }
      });
    }

    // Nouvelle nourriture si mangée
    if (ate1 || ate2) {
      gameState.food = this.generateFood([...snake1, ...snake2]);
      result.events.push({
        type: 'new_food',
        position: gameState.food
      });
    }

    // Retirer la queue si pas de nourriture mangée
    if (!ate1) gameState.snake1.pop();
    if (!ate2) gameState.snake2.pop();

    // Vérifier les morts
    const dead1 = isOutOfBounds(head1) || hitsBomb(head1) || 
                  hitsOwnBody(head1, snake1) || hitsOtherSnake(head1, snake2);
    const dead2 = isOutOfBounds(head2) || hitsBomb(head2) || 
                  hitsOwnBody(head2, snake2) || hitsOtherSnake(head2, snake1);

    if (headCollision) {
      result.gameOver = true;
      result.winner = 'draw';
      result.events.push({ type: 'head_collision' });
    } else if (dead1 && dead2) {
      result.gameOver = true;
      result.winner = 'draw';
    } else if (dead1) {
      result.gameOver = true;
      result.winner = 'snake2';
      result.events.push({ type: 'collision', snake: 'snake1' });
    } else if (dead2) {
      result.gameOver = true;
      result.winner = 'snake1';
      result.events.push({ type: 'collision', snake: 'snake2' });
    }

    return result;
  }

  // Simuler un match complet
  async simulateMatch(script1Code, script2Code) {
    const gameState = this.initializeGame();
    const replay = {
      seed: this.seed,
      initialState: JSON.parse(JSON.stringify(gameState)),
      actions: []
    };

    const startTime = Date.now();

    while (!gameState.gameOver && gameState.round < this.settings.maxRounds) {
      gameState.round++;

      // Obtenir les mouvements des scripts
      const state1 = this.createScriptState(gameState, true);
      const state2 = this.createScriptState(gameState, false);

      const move1 = this.executeScript(script1Code, state1, this.settings.timeoutMs);
      const move2 = this.executeScript(script2Code, state2, this.settings.timeoutMs);

      // Appliquer les mouvements
      gameState.snake1 = this.moveSnake(gameState.snake1, move1);
      gameState.snake2 = this.moveSnake(gameState.snake2, move2);

      // Vérifier les collisions
      const collisionResult = this.checkCollisions(gameState);
      
      if (collisionResult.gameOver) {
        gameState.gameOver = true;
        gameState.winner = collisionResult.winner;
      }

      // Enregistrer l'action pour le replay
      replay.actions.push({
        round: gameState.round,
        snake1Move: move1,
        snake2Move: move2,
        events: collisionResult.events,
        state: JSON.parse(JSON.stringify({
          snake1: gameState.snake1,
          snake2: gameState.snake2,
          food: gameState.food,
          scores: { s1: gameState.score1, s2: gameState.score2 }
        }))
      });
    }

    // Timeout si le jeu n'est pas terminé
    if (!gameState.gameOver) {
      gameState.gameOver = true;
      gameState.winner = gameState.score1 > gameState.score2 ? 'snake1' : 
                        gameState.score2 > gameState.score1 ? 'snake2' : 'draw';
    }

    return {
      result: {
        winner: gameState.winner,
        type: gameState.round >= this.settings.maxRounds ? 'timeout' : 'win',
        duration: Date.now() - startTime,
        rounds: gameState.round,
        finalScores: {
          red: gameState.score1,
          blue: gameState.score2
        }
      },
      replay
    };
  }
}

module.exports = GameEngine; 