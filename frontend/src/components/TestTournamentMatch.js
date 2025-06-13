import React, { useState, useEffect } from 'react';
import TournamentMatchViewer from './TournamentMatchViewer';

const TestTournamentMatch = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tournaments');
      const data = await response.json();
      setTournaments(data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des tournois');
      setLoading(false);
    }
  };

  const selectTournament = async (tournament) => {
    setSelectedTournament(tournament);
    await loadMatches(tournament._id);
  };

  const loadMatches = async (tournamentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/matches`);
      const matchesData = await response.json();
      setMatches(matchesData);
    } catch (err) {
      console.error('Erreur lors du chargement des matchs:', err);
      setError('Erreur lors du chargement des matchs');
    }
  };

  const executeAllMatches = async () => {
    if (!selectedTournament) return;
    
    setIsExecuting(true);
    setError('');
    
    try {
      console.log(`🚀 Exécution de tous les matchs pour le tournoi "${selectedTournament.name}"`);
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${selectedTournament._id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Tournoi exécuté avec succès !`);
      console.log(`📊 ${result.totalMatches} matchs joués`);
      
      // Recharger les matchs
      await loadMatches(selectedTournament._id);
      
      // Mettre à jour le tournoi
      setSelectedTournament(prev => ({
        ...prev,
        status: 'completed'
      }));

    } catch (err) {
      console.error('Erreur lors de l\'exécution du tournoi:', err);
      setError(`Erreur lors de l'exécution du tournoi: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const viewMatch = (match) => {
    setSelectedMatch(match);
  };

  const formatMatchTitle = (match) => {
    const user1 = match.participants[0]?.user?.username || 'Joueur 1';
    const user2 = match.participants[1]?.user?.username || 'Joueur 2';
    const script1 = match.participants[0]?.script?.name || 'Script 1';
    const script2 = match.participants[1]?.script?.name || 'Script 2';
    
    return `${user1} (${script1}) vs ${user2} (${script2})`;
  };

  const getMatchWinner = (match) => {
    if (!match.result || !match.result.winner) return 'Match nul';
    
    const winnerColor = match.result.winner.color;
    const winnerParticipant = match.participants.find(p => 
      (winnerColor === 'red' && match.participants.indexOf(p) === 0) ||
      (winnerColor === 'blue' && match.participants.indexOf(p) === 1)
    );
    
    return winnerParticipant?.user?.username || 'Gagnant inconnu';
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  // Vue du replay d'un match spécifique
  if (selectedMatch) {
    return (
      <div>
        <div className="container my-4">
          <button 
            className="btn btn-secondary mb-3"
            onClick={() => setSelectedMatch(null)}
          >
            ← Retour aux matchs
          </button>
          <h3>🎬 Replay: {formatMatchTitle(selectedMatch)}</h3>
        </div>
        
        <TournamentMatchViewer
          match={selectedMatch}
          isReplay={true}
        />
      </div>
    );
  }

  // Vue des matchs d'un tournoi
  if (selectedTournament) {
    return (
      <div className="container my-4">
        <button 
          className="btn btn-secondary mb-3"
          onClick={() => {
            setSelectedTournament(null);
            setMatches([]);
          }}
        >
          ← Retour aux tournois
        </button>

        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5>🏆 {selectedTournament.name}</h5>
                <span className={`badge ${
                  selectedTournament.status === 'completed' ? 'bg-success' : 
                  selectedTournament.status === 'running' ? 'bg-warning' : 'bg-secondary'
                }`}>
                  {selectedTournament.status}
                </span>
              </div>
              <div className="card-body">
                <p>{selectedTournament.description}</p>
                <p><strong>Participants:</strong> {selectedTournament.participants?.length || 0}</p>
                
                {selectedTournament.status === 'running' && matches.length === 0 && (
                  <div className="alert alert-info">
                    <h6>🚀 Prêt à exécuter tous les matchs</h6>
                    <p>Ce tournoi est en cours mais aucun match n'a encore été joué.</p>
                    <button 
                      className="btn btn-primary" 
                      onClick={executeAllMatches}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Exécution en cours...
                        </>
                      ) : (
                        'Exécuter tous les matchs'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h6>👥 Participants</h6>
              </div>
              <div className="card-body">
                {selectedTournament.participants?.map((participant, index) => (
                  <div key={index} className="mb-2">
                    <div className="d-flex justify-content-between">
                      <span>{participant.user?.username || 'Utilisateur inconnu'}</span>
                      <small className="text-muted">
                        {participant.script?.name || 'Script non défini'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        {/* Liste des matchs */}
        {matches.length > 0 && (
          <div className="card mt-4">
            <div className="card-header">
              <h5>🥊 Matchs du tournoi ({matches.length})</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {matches.map((match, index) => (
                  <button
                    key={match._id}
                    className="list-group-item list-group-item-action"
                    onClick={() => viewMatch(match)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">Match {index + 1}</h6>
                      <small className="text-muted">
                        {new Date(match.created).toLocaleString()}
                      </small>
                    </div>
                    <p className="mb-1">{formatMatchTitle(match)}</p>
                    <small className={
                      match.result?.winner ? 'text-success' : 'text-warning'
                    }>
                      🏆 Gagnant: {getMatchWinner(match)}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue principale avec liste des tournois
  return (
    <div className="container my-4">
      <h2>🏆 Gestionnaire de Tournois</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5>Sélectionnez un tournoi pour voir ses matchs</h5>
        </div>
        <div className="card-body">
          {tournaments.length === 0 ? (
            <p className="text-muted">Aucun tournoi disponible</p>
          ) : (
            <div className="list-group">
              {tournaments.map(tournament => (
                <button
                  key={tournament._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => selectTournament(tournament)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{tournament.name}</h6>
                    <div>
                      <span className={`badge me-2 ${
                        tournament.status === 'completed' ? 'bg-success' : 
                        tournament.status === 'running' ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {tournament.status}
                      </span>
                      <small className="text-muted">
                        {tournament.participants?.length || 0} participants
                      </small>
                    </div>
                  </div>
                  <p className="mb-1">{tournament.description}</p>
                  <small className="text-muted">
                    Type: {tournament.type} | 
                    {tournament.status === 'completed' ? ' ✅ Matchs terminés' : 
                     tournament.status === 'running' ? ' 🔄 En cours' :
                     ' 📝 En préparation'}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h6>💡 Instructions</h6>
          <ul>
            <li><strong>Tournois "running":</strong> Cliquez pour exécuter automatiquement tous les matchs</li>
            <li><strong>Tournois "completed":</strong> Cliquez pour visionner les replays des matchs</li>
            <li><strong>Visualisation:</strong> Chaque match peut être rejoué frame par frame</li>
            <li><strong>Stockage:</strong> Tous les replays sont sauvegardés en base de données</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestTournamentMatch; 