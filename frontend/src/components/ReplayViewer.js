// frontend/src/components/ReplayViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import SnakeGame from './SnakeGame';

const ReplayViewer = ({ replayData, onClose }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && replayData?.actions?.length > currentFrame) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(frame => {
          if (frame >= replayData.actions.length - 1) {
            setIsPlaying(false);
            return frame;
          }
          return frame + 1;
        });
      }, 200 / replaySpeed);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, replaySpeed, currentFrame, replayData]);

  if (!replayData || !replayData.actions || replayData.actions.length === 0) {
    return (
      <div className="alert alert-warning">
        <h5>Replay non disponible</h5>
        <p>Les données de replay ne sont pas disponibles pour ce match.</p>
        <button className="btn btn-secondary" onClick={onClose}>
          Fermer
        </button>
      </div>
    );
  }

  // Créer les fonctions de mouvement pour SnakeGame à partir des données de replay
  const createMoveFunction = (snakeNumber) => {
    return () => {
      if (currentFrame < replayData.actions.length) {
        const action = replayData.actions[currentFrame];
        return snakeNumber === 1 ? action.snake1Move : action.snake2Move;
      }
      return 'right';
    };
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleFrameChange = (newFrame) => {
    setCurrentFrame(Math.max(0, Math.min(newFrame, replayData.actions.length - 1)));
  };

  const currentAction = replayData.actions[currentFrame] || replayData.actions[0];

  return (
    <div className="replay-viewer">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Replay du Match</h4>
        <button className="btn-close" onClick={onClose}></button>
      </div>

      {/* Contrôles de replay */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="btn-group" role="group">
                <button 
                  className="btn btn-primary"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleReset}
                >
                  ⏮️
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => handleFrameChange(currentFrame - 1)}
                  disabled={currentFrame === 0}
                >
                  ◀️
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => handleFrameChange(currentFrame + 1)}
                  disabled={currentFrame >= replayData.actions.length - 1}
                >
                  ▶️
                </button>
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label small">Vitesse</label>
              <select 
                className="form-select form-select-sm"
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label small">
                Tour {currentFrame + 1} / {replayData.actions.length}
              </label>
              <input
                type="range"
                className="form-range"
                min="0"
                max={replayData.actions.length - 1}
                value={currentFrame}
                onChange={(e) => handleFrameChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur le tour actuel */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-danger">🔴 Serpent Rouge</h6>
              <p className="card-text">
                Score: <strong>{currentAction.score1}</strong><br/>
                Direction: <strong>{currentAction.snake1Move}</strong>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-primary">
            <div className="card-body text-center">
              <h6 className="card-title text-primary">🔵 Serpent Bleu</h6>
              <p className="card-text">
                Score: <strong>{currentAction.score2}</strong><br/>
                Direction: <strong>{currentAction.snake2Move}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage du jeu avec état figé */}  
      <div className="text-center">
        <SnakeGameReplay 
          gameState={currentAction}
          rows={20}
          cols={20}
        />
      </div>
    </div>
  );
};

// Composant pour afficher un état figé du jeu
const SnakeGameReplay = ({ gameState, rows = 20, cols = 20 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (canvasRef.current && gameState) {
      drawGameState(canvasRef.current, gameState, rows, cols);
    }
  }, [gameState, rows, cols]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={cols * 24}
        height={rows * 24}
        style={{ border: '1px solid #444', borderRadius: 4 }}
      />
    </div>
  );
};

const drawGameState = (canvas, gameState, rows, cols) => {
  const ctx = canvas.getContext('2d');
  const CELL = 24;
  
  const COL_BG = '#1e1e1e';
  const COL_S1 = '#ff595e';
  const COL_S2 = '#1982c4';
  const COL_FOOD = '#8ac926';

  // Efacer le canvas
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, cols * CELL, rows * CELL);

  // Dessiner la nourriture
  if (gameState.food) {
    ctx.fillStyle = COL_FOOD;
    ctx.beginPath();
    ctx.arc(
      (gameState.food.y + 0.5) * CELL,
      (gameState.food.x + 0.5) * CELL,
      CELL * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Fonction helper pour dessiner un serpent
  const drawSnake = (snake, color) => {
    if (!snake || snake.length === 0) return;
    
    ctx.fillStyle = color;
    snake.forEach(({ x, y }, i) => {
      if (i === 0) {
        // Tête du serpent
        ctx.fillRect(y * CELL, x * CELL, CELL, CELL);
        // Yeux
        ctx.fillStyle = '#000';
        const eyeSize = CELL * 0.15;
        const eyeOffset = CELL * 0.2;
        ctx.fillRect(
          y * CELL + eyeOffset,
          x * CELL + eyeOffset,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          y * CELL + CELL - eyeOffset - eyeSize,
          x * CELL + eyeOffset,
          eyeSize,
          eyeSize
        );
        ctx.fillStyle = color;
      } else {
        // Corps du serpent
        ctx.fillRect(
          y * CELL + 1,
          x * CELL + 1,
          CELL - 2,
          CELL - 2
        );
      }
    });
  };

  // Dessiner les deux serpents
  if (gameState.snake1) drawSnake(gameState.snake1, COL_S1);
  if (gameState.snake2) drawSnake(gameState.snake2, COL_S2);
};

export default ReplayViewer;