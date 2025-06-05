import React, { useState, useRef, useEffect } from 'react';
import SnakeGame from './SnakeGame';
import { scriptService } from '../services/scriptService';
import './Sandbox.css';

const defaultScript = `function nextMove(state) {
  // État du jeu disponible :
  // - state.me : positions de mon serpent (tête en 0)
  // - state.opponent : positions du serpent adverse
  // - state.food : position de la nourriture
  // - state.score : mon score actuel
  
  const head = state.me[0];
  const food = state.food;
  
  // Stratégie simple : aller vers la nourriture
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}`;

const Sandbox = () => {
  const [script1, setScript1] = useState(defaultScript);
  const [script2, setScript2] = useState('');
  const [mode, setMode] = useState('vs-greedy');
  const [difficulty, setDifficulty] = useState('normal');
  const [gameKey, setGameKey] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [savedScripts, setSavedScripts] = useState([]);
  const gameRef = useRef(null);

  // Charger les scripts sauvegardés au montage du composant
  useEffect(() => {
    const loadSavedScripts = async () => {
      try {
        const scripts = await scriptService.getUserScripts();
        setSavedScripts(scripts);
      } catch (error) {
        console.error('Erreur lors du chargement des scripts:', error);
      }
    };
    loadSavedScripts();
  }, []);

  const handleScript1Change = (e) => {
    setScript1(e.target.value);
  };

  const handleScript2Change = (e) => {
    setScript2(e.target.value);
  };

  const handleScriptSelect = (scriptNumber, e) => {
    const selectedScript = savedScripts.find(s => s._id === e.target.value);
    if (selectedScript) {
      if (scriptNumber === 1) {
        setScript1(selectedScript.code);
      } else {
        setScript2(selectedScript.code);
      }
    }
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
      // Créer une fonction isolée pour chaque évaluation
      const fn = new Function('state', `
        ${script1}
        const result = nextMove(state);
        if (!['up', 'down', 'left', 'right'].includes(result)) {
          throw new Error('Direction invalide: ' + result);
        }
        return result;
      `);
      return fn(state);
    } catch (error) {
      console.error('Erreur dans le script 1:', error);
      // En cas d'erreur, continuer dans la même direction qu'avant
      return state.prevDir1 || 'right';
    }
  };

  const evaluateScript2 = (state) => {
    if (!script2) return null;
    try {
      // Créer une fonction isolée pour chaque évaluation
      const fn = new Function('state', `
        ${script2}
        const result = nextMove(state);
        if (!['up', 'down', 'left', 'right'].includes(result)) {
          throw new Error('Direction invalide: ' + result);
        }
        return result;
      `);
      return fn(state);
    } catch (error) {
      console.error('Erreur dans le script 2:', error);
      // En cas d'erreur, continuer dans la même direction qu'avant
      return state.prevDir2 || 'left';
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Mode Sandbox</h2>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="form-group">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label htmlFor="script1">Script Rouge</label>
              <select
                className="form-select w-auto"
                onChange={(e) => handleScriptSelect(1, e)}
                value=""
              >
                <option value="">Choisir un script sauvegardé</option>
                {savedScripts.map(script => (
                  <option key={script._id} value={script._id}>
                    {script.name}
                  </option>
                ))}
              </select>
            </div>
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label htmlFor="script2">Script Bleu</label>
                <select
                  className="form-select w-auto"
                  onChange={(e) => handleScriptSelect(2, e)}
                  value=""
                >
                  <option value="">Choisir un script sauvegardé</option>
                  {savedScripts.map(script => (
                    <option key={script._id} value={script._id}>
                      {script.name}
                    </option>
                  ))}
                </select>
              </div>
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
        <div className="col-md-4">
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
        <div className="col-md-4">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulté</label>
            <select
              id="difficulty"
              className="form-control"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="hard">Difficile</option>
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <button
            className="btn btn-primary mt-4"
            onClick={handleStart}
          >
            {showGame ? 'Redémarrer' : 'Lancer'} la partie
          </button>
        </div>
      </div>

      {difficulty === 'hard' && (
        <div className="alert alert-info mb-4">
          <strong>Mode Difficile :</strong>
          <ul className="mb-0">
            <li>Vision limitée à 3 cases autour du serpent</li>
            <li>Présence de bombes sur le terrain</li>
          </ul>
        </div>
      )}

      {showGame && (
        <div className="row">
          <div className="col-md-9">
            <div className="game-section" ref={gameRef}>
              <div className="game-container">
                {gameResult && (
                  <div className="alert alert-info text-center mb-3">
                    {gameResult.winner === 'snake1' ? 'Le Serpent Rouge a gagné !' : 
                     gameResult.winner === 'snake2' ? 'Le Serpent Bleu a gagné !' : 
                     'Match nul !'}
                    <br />
                    <small>
                      Temps : {gameResult.time} | 
                      Score final : Rouge {gameResult.scores.snake1} - {gameResult.scores.snake2} Bleu
                    </small>
                  </div>
                )}
                <SnakeGame
                  key={gameKey}
                  userMove={evaluateScript1}
                  userMove2={mode === 'script-vs-script' ? evaluateScript2 : null}
                  mode={mode}
                  difficulty={difficulty}
                  onEnd={handleGameEnd}
                />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="d-grid gap-2">
              <button
                className="btn btn-lg btn-outline-primary"
                onClick={handleStart}
              >
                Relancer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sandbox; 