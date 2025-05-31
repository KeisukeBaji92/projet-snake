import React, { useState, useRef } from 'react';
import SnakeGame from './SnakeGame';
import './Sandbox.css';

const defaultScript = `function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}`;

const Sandbox = () => {
  const [script1, setScript1] = useState(defaultScript);
  const [script2, setScript2] = useState('');
  const [mode, setMode] = useState('vs-greedy');
  const [gameKey, setGameKey] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const gameRef = useRef(null);

  const handleScript1Change = (e) => {
    setScript1(e.target.value);
  };

  const handleScript2Change = (e) => {
    setScript2(e.target.value);
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setShowGame(false);
  };

  const handleStart = () => {
    setGameKey(prev => prev + 1);
    setShowGame(true);
    setGameResult(null);
    setTimeout(() => {
      gameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleGameEnd = (result) => {
    setGameResult(result);
    console.log('Partie terminée:', result);
  };

  const evaluateScript1 = (state) => {
    try {
      const fn = new Function('state', script1 + '\nreturn nextMove(state);');
      return fn(state);
    } catch (error) {
      console.error('Erreur dans le script 1:', error);
      return 'right';
    }
  };

  const evaluateScript2 = (state) => {
    if (!script2) return null;
    try {
      const fn = new Function('state', script2 + '\nreturn nextMove(state);');
      return fn(state);
    } catch (error) {
      console.error('Erreur dans le script 2:', error);
      return 'left';
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Mode Sandbox</h2>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="form-group">
            <label htmlFor="script1">Script Rouge</label>
            <textarea
              id="script1"
              className="form-control font-monospace"
              rows="10"
              value={script1}
              onChange={handleScript1Change}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
        
        {mode === 'script-vs-script' && (
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="script2">Script Bleu</label>
              <textarea
                id="script2"
                className="form-control font-monospace"
                rows="10"
                value={script2}
                onChange={handleScript2Change}
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="form-group">
            <label htmlFor="mode">Mode de jeu</label>
            <select
              id="mode"
              className="form-control"
              value={mode}
              onChange={handleModeChange}
            >
              <option value="vs-greedy">Contre Bot Greedy</option>
              <option value="mirror">Mode Miroir</option>
              <option value="script-vs-script">Script vs Script</option>
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <button
            className="btn btn-primary mt-4"
            onClick={handleStart}
          >
            {showGame ? 'Redémarrer' : 'Lancer'} la partie
          </button>
        </div>
      </div>

      {showGame && (
        <div className="game-section" ref={gameRef}>
          <div className="game-container">
            {gameResult && (
              <div className="alert alert-info text-center mb-3">
                {gameResult.winner === 'snake1' ? 'Le Serpent Rouge a gagné !' : 
                 gameResult.winner === 'snake2' ? 'Le Serpent Bleu a gagné !' : 
                 'Match nul !'}
                {gameResult.reason && ` (${gameResult.reason})`}
              </div>
            )}
            <SnakeGame
              key={gameKey}
              userMove={evaluateScript1}
              userMove2={mode === 'script-vs-script' ? evaluateScript2 : null}
              mode={mode}
              onEnd={handleGameEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sandbox; 