import React, { useState, useCallback, useRef } from 'react';
import SnakeGame from './SnakeGame';
import { defaultScript, scriptBaladeur } from './defaultScripts';
import './Sandbox.css';

export default function Sandbox() {
  const [code1, setCode1] = useState(defaultScript);
  const [code2, setCode2] = useState(scriptBaladeur);
  const [script1, setScript1] = useState(null);
  const [script2, setScript2] = useState(null);
  const [mode, setMode] = useState('mirror');
  const [key, setKey] = useState(0);
  const gameRef = useRef(null);

  const loadScripts = useCallback(() => {
    if (!code1.trim()) {
      alert('Script 1 vide !');
      return;
    }

    try {
      // Compilation sécurisée des scripts
      const fn1 = compileScript(code1, 'Script 1');
      const fn2 = code2.trim() ? compileScript(code2, 'Script 2') : null;

      setScript1(() => fn1);
      setScript2(() => fn2);
      setKey(k => k + 1);

      // Scroll vers le jeu après un court délai pour laisser le temps au composant de se monter
      setTimeout(() => {
        gameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (e) {
      alert('Erreur de compilation : ' + e.message);
    }
  }, [code1, code2]);

  return (
    <div className="sandbox">
      <h1>Snake Arena - Sandbox</h1>

      <div className="code-container">
        <div className="code-editor">
          <h3>Script 1 (Rouge)</h3>
          <textarea
            placeholder="function nextMove(state) { return 'right'; }"
            value={code1}
            onChange={e => setCode1(e.target.value)}
          />
        </div>

        <div className="code-editor">
          <h3>Script 2 (Bleu)</h3>
          <textarea
            placeholder="// facultatif sauf pour le duel"
            value={code2}
            onChange={e => setCode2(e.target.value)}
          />
        </div>
      </div>

      <div className="controls">
        <button onClick={loadScripts}>Charger & lancer</button>
      </div>

      <div className="game-mode-selector">
        <label>
          <input
            type="radio"
            checked={mode === 'mirror'}
            onChange={() => { setMode('mirror'); setKey(k => k + 1); }}
          /> Mirror
        </label>
        <label>
          <input
            type="radio"
            checked={mode === 'greedy'}
            onChange={() => { setMode('greedy'); setKey(k => k + 1); }}
          /> Vs Greedy
        </label>
        <label>
          <input
            type="radio"
            checked={mode === 'duel'}
            onChange={() => { setMode('duel'); setKey(k => k + 1); }}
          /> Script 1 vs Script 2
        </label>
        <button onClick={() => setKey(k => k + 1)}>Reset game</button>
      </div>

      {script1 && (
        <div ref={gameRef} className="game-container">
          <SnakeGame
            key={key}
            userMove={script1}
            userMove2={script2}
            mode={mode}
            onEnd={w => alert('Partie terminée – gagnant : ' + w)}
          />
        </div>
      )}
    </div>
  );
}

function compileScript(src, label) {
  try {
    // Vérifier la présence de la fonction nextMove
    if (!src.includes('function nextMove')) {
      throw new Error(`${label} : fonction nextMove manquante`);
    }

    // Créer une fonction sécurisée
    const scriptFn = new Function('state', `
      ${src}
      if (typeof nextMove !== 'function') {
        throw new Error('${label} : fonction nextMove manquante');
      }
      return nextMove(state);
    `);

    // Tester la fonction avec un état factice
    const testState = {
      rows: 20,
      cols: 20,
      me: [{x: 0, y: 0}],
      you: [{x: 19, y: 19}],
      food: {x: 10, y: 10}
    };

    const result = scriptFn(testState);
    if (!['up', 'down', 'left', 'right'].includes(result)) {
      throw new Error(`${label} : direction invalide retournée`);
    }

    return scriptFn;
  } catch (e) {
    throw new Error(`${label} : ${e.message}`);
  }
} 