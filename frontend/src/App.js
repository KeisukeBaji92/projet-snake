import React, { useState, useCallback } from 'react';
import SnakeGame from './SnakeGame';

export default function App() {
  const [code, setCode]   = useState('');
  const [script, setScript] = useState(null);     // fonction nextMove prête
  const [mode, setMode]   = useState('mirror');   // 'mirror' | 'greedy'
  const [gameKey, setGameKey] = useState(0);      // pour reset

  /* compile le code collé par l’utilisateur */
  const loadScript = useCallback(() => {
    if (!code.trim()) { alert('Colle un script !'); return; }

    try {
      /* On construit une fonction qui retourne nextMove(state) */
      const fn = new Function(
        'state',
        `${code}\n if (typeof nextMove!=="function") throw 'no nextMove';\n return nextMove(state);`
      );
      setScript(() => fn);       // stocke la fonction prête
      setGameKey(k => k+1);      // reset la partie
    } catch (err) {
      alert('Erreur dans ton script : ' + err);
    }
  }, [code]);

  return (
    <div style={{padding:20}}>
      <h1>Snake – Script Arena</h1>

      <textarea
        style={{width:'100%',maxWidth:600,height:150,marginTop:10,fontFamily:'monospace'}}
        placeholder="function nextMove(state) { /* … */ }"
        value={code}
        onChange={e=>setCode(e.target.value)}
      />
      <div style={{marginTop:8}}>
        <button onClick={loadScript}>Charger & lancer</button>
      </div>

      <div style={{marginTop:10}}>
        <label>
          <input type="radio" checked={mode==='mirror'} onChange={()=>setMode('mirror')}/> Mirror
        </label>{' '}
        <label>
          <input type="radio" checked={mode==='greedy'} onChange={()=>setMode('greedy')}/> Vs Greedy
        </label>{' '}
        <button onClick={()=>setGameKey(k=>k+1)}>Reset game</button>
      </div>

      {/* Lancement du jeu */}
      {script && (
        <SnakeGame
          key={gameKey}
          userMove={script}
          mode={mode}
          onEnd={(w)=>alert('Partie terminée – gagnant : '+w)}
        />
      )}
    </div>
  );
}
