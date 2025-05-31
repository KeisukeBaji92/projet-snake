import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SnakeGame from './components/SnakeGame';
import { SCRIPT_EMPTY, SCRIPT_GREEDY, SCRIPT_WANDERER } from './components/defaultScripts';

function Home() {
  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Snake Battle Arena</h1>
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Mode Miroir</h5>
              <p className="card-text">Votre script contrôle les deux serpents de manière symétrique.</p>
              <Link to="/mirror" className="btn btn-primary">Jouer</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">VS Bot Greedy</h5>
              <p className="card-text">Affrontez un bot qui cherche la nourriture directement.</p>
              <Link to="/vs-greedy" className="btn btn-primary">Jouer</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Script VS Script</h5>
              <p className="card-text">Faites s'affronter deux scripts Python.</p>
              <Link to="/duel" className="btn btn-primary">Jouer</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameMode({ mode, script1 = SCRIPT_EMPTY, script2 = null }) {
  const [code1, setCode1] = React.useState(script1);
  const [code2, setCode2] = React.useState(script2 || SCRIPT_GREEDY);
  const [error, setError] = React.useState(null);

  const compileScript = (code) => {
    try {
      // Ici on pourrait ajouter une validation plus poussée du code Python
      if (!code.includes('def move(state):')) {
        throw new Error('Le script doit contenir une fonction move(state)');
      }
      return (state) => {
        // Simulation basique - à remplacer par une vraie compilation Python
        const lines = code.split('\n');
        const moveLines = lines.filter(l => l.includes('return'));
        if (!moveLines.length) return 'right';
        
        const dir = moveLines[0].split('return')[1].trim().replace(/['"]/g, '');
        return dir;
      };
    } catch (err) {
      setError(err.message);
      return () => 'right';
    }
  };

  return (
    <div className="container mt-4">
      <Link to="/" className="btn btn-secondary mb-4">← Retour</Link>
      
      <div className="row">
        <div className="col-md-8">
          <SnakeGame
            mode={mode}
            userMove={compileScript(code1)}
            userMove2={mode === 'duel' ? compileScript(code2) : null}
          />
        </div>
        
        <div className="col-md-4">
          <div className="mb-3">
            <label className="form-label">Script Python 1:</label>
            <textarea
              className="form-control font-monospace"
              rows="10"
              value={code1}
              onChange={e => setCode1(e.target.value)}
            />
          </div>
          
          {mode === 'duel' && (
            <div className="mb-3">
              <label className="form-label">Script Python 2:</label>
              <textarea
                className="form-control font-monospace"
                rows="10"
                value={code2}
                onChange={e => setCode2(e.target.value)}
              />
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mirror" element={<GameMode mode="mirror" script1={SCRIPT_WANDERER} />} />
        <Route path="/vs-greedy" element={<GameMode mode="greedy" script1={SCRIPT_EMPTY} />} />
        <Route path="/duel" element={<GameMode mode="duel" script1={SCRIPT_EMPTY} script2={SCRIPT_GREEDY} />} />
      </Routes>
    </Router>
  );
} 