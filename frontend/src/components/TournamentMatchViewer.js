import React, { useState, useEffect, useRef } from 'react';
import SnakeGame from './SnakeGame';

const TournamentMatchViewer = ({ tournamentId, participant1, participant2, isLive = false }) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const gameRef = useRef(null);

  // Créer les fonctions de script à partir du code
  const createScriptFunction = (scriptCode) => {
    return (state) => {
      try {
        // Créer une fonction isolée pour chaque évaluation
        const fn = new Function('state', `
          ${scriptCode}
          const result = nextMove(state);
          if (!['up', 'down', 'left', 'right'].includes(result)) {
            throw new Error('Direction invalide: ' + result);
          }
          return result;
        `);
        return fn(state);
      } catch (error) {
        console.error('Erreur dans le script:', error);
        return 'right'; // Direction par défaut
      }
    };
  };

  // Charger les données du match
  useEffect(() => {
    const loadMatchData = async () => {
      try {
        setLoading(true);
        
        if (isLive && participant1 && participant2) {
          // Mode live : utiliser directement les participants
          setMatchData({
            participant1,
            participant2,
            isLive: true
          });
        } else {
          // Mode replay : charger depuis l'API
          const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
          const matches = await response.json();
          
          if (matches.length > 0) {
            const match = matches[0]; // Prendre le premier match pour l'exemple
            setMatchData({
              match,
              isLive: false
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    if (tournamentId && (participant1 && participant2 || !isLive)) {
      loadMatchData();
    }
  }, [tournamentId, participant1, participant2, isLive]);

  const handleGameEnd = (result) => {
    setGameResult(result);
    console.log('Match terminé:', result);
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du match...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="container my-4">
        <div className="alert alert-info" role="alert">
          Aucune donnée de match disponible
        </div>
      </div>
    );
  }

  const getParticipantData = () => {
    if (matchData.isLive) {
      return {
        p1: matchData.participant1,
        p2: matchData.participant2
      };
    } else {
      return {
        p1: matchData.match.participants[0],
        p2: matchData.match.participants[1]
      };
    }
  };

  const { p1, p2 } = getParticipantData();

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          {/* En-tête du match */}
          <div className="card mb-4">
            <div className="card-header">
              <h3>
                {matchData.isLive ? '🔴 MATCH EN DIRECT' : '📹 REPLAY DU MATCH'}
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-5 text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="badge bg-danger me-2">ROUGE</span>
                    <div>
                      <h5 className="mb-0">{p1.user?.username || 'Joueur 1'}</h5>
                      <small className="text-muted">{p1.script?.name || 'Script 1'}</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 text-center">
                  <h4>VS</h4>
                </div>
                <div className="col-md-5 text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <div>
                      <h5 className="mb-0">{p2.user?.username || 'Joueur 2'}</h5>
                      <small className="text-muted">{p2.script?.name || 'Script 2'}</small>
                    </div>
                    <span className="badge bg-primary ms-2">BLEU</span>
                  </div>
                </div>
              </div>
              
              {gameResult && (
                <div className="mt-3 text-center">
                  <div className="alert alert-success">
                    <h5>🏆 Match terminé !</h5>
                    <p className="mb-0">
                      Gagnant: {gameResult.winner === 'snake1' ? p1.user?.username : 
                               gameResult.winner === 'snake2' ? p2.user?.username : 'Match nul'}
                      <br />
                      Score final: {gameResult.scores.snake1} - {gameResult.scores.snake2}
                      <br />
                      Durée: {gameResult.time}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone de jeu */}
          <div className="card">
            <div className="card-body d-flex justify-content-center">
              {p1.script?.code && p2.script?.code ? (
                <SnakeGame
                  ref={gameRef}
                  userMove={createScriptFunction(p1.script.code)}
                  userMove2={createScriptFunction(p2.script.code)}
                  mode="script-vs-script"
                  difficulty="normal"
                  onEnd={handleGameEnd}
                  rows={20}
                  cols={20}
                />
              ) : (
                <div className="alert alert-warning">
                  Scripts non disponibles pour ce match
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="card mt-4">
            <div className="card-body">
              <h5>💡 Informations</h5>
              <ul className="list-unstyled">
                <li>🔴 <strong>Serpent Rouge:</strong> {p1.user?.username} avec le script "{p1.script?.name}"</li>
                <li>🔵 <strong>Serpent Bleu:</strong> {p2.user?.username} avec le script "{p2.script?.name}"</li>
                <li>⚡ <strong>Mode:</strong> {matchData.isLive ? 'Simulation en direct' : 'Replay'}</li>
                <li>🎯 <strong>Objectif:</strong> Manger le plus de nourriture sans entrer en collision</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentMatchViewer; 