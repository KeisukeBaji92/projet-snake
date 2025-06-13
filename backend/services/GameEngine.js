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

  // Initialiser l'état du jeu - CORRIGÉ
  initializeGame() {
    const state = {
      snake1: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 1, y: 3 }
      ],
      snake2: [
        { x: this.settings.rows - 4, y: this.settings.cols - 4 },
        { x: this.settings.rows - 3, y: this.settings.cols - 4 },
        { x: this.settings.rows - 2, y: this.settings.cols - 4 }
      ],
      dir1: 'down',
      dir2: 'up',
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

  // Générer une position de nourriture - CORRIGÉ
  generateFood(occupiedPositions) {
    const free = [];
    for (let x = 0; x < this.settings.rows; x++) {
      for (let y = 0; y < this.settings.cols; y++) {
        if (!occupiedPositions.some(pos => pos.x === x && pos.y === y)) {
          free.push({ x, y });
        }
      }
    }
    
    // CORRECTION: S'assurer qu'on a toujours de la nourriture
    if (free.length === 0) {
      return { x: Math.floor(this.settings.rows / 2), y: Math.floor(this.settings.cols / 2) };
    }
    
    return free[Math.floor(this.random() * free.length)];
  }

  // Générer les bombes pour le mode difficile
  generateBombs() {
    const bombs = [];
    const occupiedPositions = [
      { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 },
      { x: this.settings.rows - 4, y: this.settings.cols - 4 },
      { x: this.settings.rows - 3, y: this.settings.cols - 4 },
      { x: this.settings.rows - 2, y: this.settings.cols - 4 }
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

  // Créer l'état de jeu pour un script avec vision limitée - SIMPLIFIÉ
  createScriptState(gameState, isSnake1) {
    const mySnake = isSnake1 ? gameState.snake1 : gameState.snake2;
    const enemySnake = isSnake1 ? gameState.snake2 : gameState.snake1;

    return {
      me: mySnake,
      opponent: enemySnake,
      you: enemySnake, // Alias pour compatibilité
      mySnake: { body: mySnake }, // Format alternatif
      food: gameState.food,
      bombs: gameState.bombs || [],
      board: {
        width: this.settings.cols,
        height: this.settings.rows
      },
      turn: gameState.round,
      score: {
        me: isSnake1 ? gameState.score1 : gameState.score2,
        opponent: isSnake1 ? gameState.score2 : gameState.score1
      },
      difficulty: this.settings.difficulty,
      rows: this.settings.rows,
      cols: this.settings.cols
    };
  }

  // Exécuter un script de manière sécurisée - AMÉLIORÉ
  executeScript(scriptCode, gameState, timeoutMs = 1000) {
    try {
      const vm = new VM({
        timeout: timeoutMs,
        sandbox: {
          state: gameState,
          gameState: gameState, // Alias
          console: {
            log: () => {} // Désactiver console.log dans les scripts
          }
        }
      });

      // Wrapper pour plusieurs formats de fonctions
      const wrappedCode = `
        ${scriptCode}
        
        let result = 'right'; // Défaut
        
        if (typeof nextMove === 'function') {
          result = nextMove(state);
        } else if (typeof makeMove === 'function') {
          result = makeMove(state);
        } else if (typeof move === 'function') {
          result = move(state);
        }
        
        result;
      `;

      const result = vm.run(wrappedCode);
      
      // Valider et normaliser le mouvement
      if (typeof result === 'string') {
        const normalized = result.toLowerCase().trim();
        if (['up', 'down', 'left', 'right'].includes(normalized)) {
          return normalized;
        }
      }
      
      return 'right'; // Mouvement par défaut
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

  // Vérifier les collisions - AMÉLIORÉ
  checkCollisions(gameState) {
    const { snake1, snake2, food, bombs } = gameState;
    const head1 = snake1[0];
    const head2 = snake2[0];

    // CORRECTION: Vérifier si la nourriture existe
    if (!food) {
      gameState.food = this.generateFood([...snake1, ...snake2]);
    }

    // Collision avec les murs
    const isOutOfBounds = (head) => 
      head.x < 0 || head.x >= this.settings.rows || 
      head.y < 0 || head.y >= this.settings.cols;

    // Collision avec les bombes
    const hitsBomb = (head) => 
      this.settings.difficulty === 'hard' && 
      bombs && bombs.some(bomb => bomb.x === head.x && bomb.y === head.y);

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
    
    if (gameState.food && head1.x === gameState.food.x && head1.y === gameState.food.y) {
      ate1 = true;
      gameState.score1++;
      result.events.push({
        type: 'food_eaten',
        snake: 'snake1',
        position: { x: head1.x, y: head1.y }
      });
    }
    
    if (gameState.food && head2.x === gameState.food.x && head2.y === gameState.food.y) {
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
        events: collisionResult.events || [],
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