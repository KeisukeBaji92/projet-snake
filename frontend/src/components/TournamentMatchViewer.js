import React, { useState, useEffect, useRef } from 'react';

const TournamentMatchViewer = ({ match, isReplay = false }) => {
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(100); // ms entre chaque frame
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (match && match.replay && match.replay.actions) {
      setEvents(match.replay.actions);
      if (match.replay.actions.length > 0) {
        // Initialiser avec le premier état
        setGameState(match.replay.actions[0].state);
      }
    }
  }, [match]);

  // Contrôles de lecture
  const play = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentEventIndex(prev => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
          return prev;
        }
        
        // Mettre à jour l'état du jeu
        const nextEvent = events[prev + 1];
        if (nextEvent) {
          setGameState(nextEvent.state);
        }
        
        return prev + 1;
      });
    }, playbackSpeed);
  };

  const pause = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const stop = () => {
    pause();
    setCurrentEventIndex(0);
    if (events.length > 0) {
      setGameState(events[0].state);
    }
  };

  const stepForward = () => {
    if (currentEventIndex < events.length - 1) {
      const nextIndex = currentEventIndex + 1;
      setCurrentEventIndex(nextIndex);
      setGameState(events[nextIndex].state);
    }
  };

  const stepBackward = () => {
    if (currentEventIndex > 0) {
      const prevIndex = currentEventIndex - 1;
      setCurrentEventIndex(prevIndex);
      setGameState(events[prevIndex].state);
    }
  };

  const jumpToFrame = (frameIndex) => {
    if (frameIndex >= 0 && frameIndex < events.length) {
      setCurrentEventIndex(frameIndex);
      setGameState(events[frameIndex].state);
    }
  };

  // Rendu du plateau de jeu
  const renderBoard = () => {
    if (!gameState) return null;

    const { snake1, snake2, food, scores } = gameState;
    // Déduire la taille du plateau depuis les paramètres du match
    const boardSize = match.settings?.gridSize?.rows || 20;

    return (
      <div className="game-board-container">
        <div className="d-flex justify-content-between mb-2">
          <div className="badge bg-danger">Rouge: {scores?.s1 || 0}</div>
          <div className="badge bg-info">Frame {currentEventIndex + 1}/{events.length}</div>
          <div className="badge bg-primary">Bleu: {scores?.s2 || 0}</div>
        </div>
        
        <div 
          className="game-board" 
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${boardSize}, 20px)`,
            gridTemplateRows: `repeat(${boardSize}, 20px)`,
            gap: '1px',
            backgroundColor: '#e0e0e0',
            padding: '10px',
            border: '2px solid #333'
          }}
        >
          {Array.from({ length: boardSize }, (_, rowIndex) => 
            Array.from({ length: boardSize }, (_, colIndex) => {
              let className = 'game-cell';
              let backgroundColor = '#f0f0f0';
              
              // Nourriture
              if (food && food.x === colIndex && food.y === rowIndex) {
                backgroundColor = '#ff0000';
              }
              
              // Snake 1 (rouge)
              const isSnake1 = snake1 && snake1.some(segment => segment.x === colIndex && segment.y === rowIndex);
              if (isSnake1) {
                const isHead = snake1[0].x === colIndex && snake1[0].y === rowIndex;
                backgroundColor = isHead ? '#8B0000' : '#DC143C';
              }
              
              // Snake 2 (bleu)
              const isSnake2 = snake2 && snake2.some(segment => segment.x === colIndex && segment.y === rowIndex);
              if (isSnake2) {
                const isHead = snake2[0].x === colIndex && snake2[0].y === rowIndex;
                backgroundColor = isHead ? '#00008B' : '#4169E1';
              }
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={className}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor,
                    border: '1px solid #ccc'
                  }}
                />
              );
            })
          ).flat()}
        </div>
      </div>
    );
  };

  if (!match) {
    return (
      <div className="container my-4">
        <div className="alert alert-info" role="alert">
          Aucun match sélectionné
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning" role="alert">
          Aucune donnée de replay disponible pour ce match
        </div>
      </div>
    );
  }

  const participant1 = match.participants[0];
  const participant2 = match.participants[1];

  return (
    <div className="container my-4">
      {/* En-tête du match */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>🎬 REPLAY DU MATCH</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 text-center">
              <div className="d-flex align-items-center justify-content-center">
                <span className="badge bg-danger me-2">ROUGE</span>
                <div>
                  <h5 className="mb-0">{participant1.user?.username || 'Joueur 1'}</h5>
                  <small className="text-muted">{participant1.script?.name || 'Script 1'}</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 text-center">
              <h4>VS</h4>
            </div>
            <div className="col-md-5 text-center">
              <div className="d-flex align-items-center justify-content-center">
                <div>
                  <h5 className="mb-0">{participant2.user?.username || 'Joueur 2'}</h5>
                  <small className="text-muted">{participant2.script?.name || 'Script 2'}</small>
                </div>
                <span className="badge bg-primary ms-2">BLEU</span>
              </div>
            </div>
          </div>
          
          {match.result && (
            <div className="mt-3 text-center">
              <div className="alert alert-success">
                <h5>🏆 Résultat final</h5>
                <p className="mb-0">
                  Gagnant: {match.result.winner ? 
                    (match.result.winner.color === 'red' ? participant1.user?.username : participant2.user?.username) :
                    'Match nul'
                  }
                  <br />
                  Score final: {match.result.finalScores?.red || 0} - {match.result.finalScores?.blue || 0}
                  <br />
                  Durée: {events.length} frames
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles de lecture */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="btn-group me-3" role="group">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={stepBackward}
                  disabled={currentEventIndex === 0}
                  title="Frame précédente"
                >
                  ⏮
                </button>
                
                {!isPlaying ? (
                  <button 
                    className="btn btn-outline-success"
                    onClick={play}
                    disabled={currentEventIndex >= events.length - 1}
                    title="Lecture"
                  >
                    ▶
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline-warning"
                    onClick={pause}
                    title="Pause"
                  >
                    ⏸
                  </button>
                )}
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={stop}
                  title="Arrêt"
                >
                  ⏹
                </button>
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={stepForward}
                  disabled={currentEventIndex >= events.length - 1}
                  title="Frame suivante"
                >
                  ⏭
                </button>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <label className="form-label me-2 mb-0">Vitesse:</label>
                <select 
                  className="form-select form-select-sm"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  style={{ width: 'auto' }}
                >
                  <option value={25}>4x</option>
                  <option value={50}>2x</option>
                  <option value={100}>1x</option>
                  <option value={200}>0.5x</option>
                  <option value={500}>0.2x</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-3">
            <input
              type="range"
              className="form-range"
              min="0"
              max={events.length - 1}
              value={currentEventIndex}
              onChange={(e) => jumpToFrame(Number(e.target.value))}
            />
            <div className="d-flex justify-content-between">
              <small>Frame 1</small>
              <small>Frame {currentEventIndex + 1} / {events.length}</small>
              <small>Frame {events.length}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de jeu */}
      <div className="card">
        <div className="card-body d-flex justify-content-center">
          {renderBoard()}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default TournamentMatchViewer; 