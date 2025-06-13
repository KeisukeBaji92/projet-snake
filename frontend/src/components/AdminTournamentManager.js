import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminTournamentManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

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

  const startTournament = async (tournamentId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du démarrage');
      }

      const result = await response.json();
      console.log(`✅ ${result.message}`);
      
      // Recharger les tournois
      await loadTournaments();
      
    } catch (error) {
      console.error('Erreur démarrage tournoi:', error);
      setError(`Erreur lors du démarrage: ${error.message}`);
    }
  };

  const viewTournamentMatches = async (tournament) => {
    try {
      setSelectedTournament(tournament);
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournament._id}/matches`);
      const matchesData = await response.json();
      setMatches(matchesData);
    } catch (err) {
      setError('Erreur lors du chargement des matchs');
    }
  };

  const deleteTournament = async (tournamentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await loadTournaments();
    } catch (error) {
      setError(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const viewMatchReplay = (match) => {
    navigate(`/replay/${match._id}`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      registering: { bg: 'bg-info', text: 'Inscriptions ouvertes' },
      running: { bg: 'bg-warning', text: 'En cours' },
      completed: { bg: 'bg-success', text: 'Terminé' }
    };
    const style = styles[status] || { bg: 'bg-secondary', text: status };
    return <span className={`badge ${style.bg}`}>{style.text}</span>;
  };

  if (loading) return <div className="text-center p-4">Chargement...</div>;

  // Vue des matchs d'un tournoi sélectionné
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
                {getStatusBadge(selectedTournament.status)}
              </div>
              <div className="card-body">
                <p><strong>Participants:</strong> {selectedTournament.participants?.length || 0}</p>
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
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">{participant.user?.username}</span>
                    <span className="text-muted">{participant.script?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>🥊 Matchs du tournoi ({matches.length})</h5>
          </div>
          <div className="card-body">
            {matches.length === 0 ? (
              <div className="alert alert-info">Aucun match trouvé pour ce tournoi</div>
            ) : (
              <div className="row">
                {matches.map((match, index) => {
                  const user1 = match.participants[0]?.user?.username || 'Joueur 1';
                  const user2 = match.participants[1]?.user?.username || 'Joueur 2';
                  const script1 = match.participants[0]?.script?.name || 'Script 1';
                  const script2 = match.participants[1]?.script?.name || 'Script 2';
                  
                  const winner = match.result?.winner ? 
                    (match.result.winner.color === 'red' ? user1 : user2) : 
                    'Match nul';
                  
                  const hasReplay = match.replay?.actions?.length > 0;
                  const frames = match.replay?.actions?.length || 0;

                  return (
                    <div key={match._id} className="col-md-6 mb-3">
                      <div className="card">
                        <div className="card-header">
                          <h6>Match {index + 1}</h6>
                          <small className="text-muted">{new Date(match.created).toLocaleString()}</small>
                        </div>
                        <div className="card-body">
                          <p><strong>{user1}</strong> ({script1}) vs <strong>{user2}</strong> ({script2})</p>
                          <p>🏆 <strong>Gagnant:</strong> {winner}</p>
                          <p>🎬 <strong>Frames:</strong> {frames}</p>
                          
                          {hasReplay ? (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => viewMatchReplay(match)}
                            >
                              📺 Voir le replay
                            </button>
                          ) : (
                            <span className="text-muted">Pas de replay disponible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue principale - liste des tournois par catégorie
  const registeringTournaments = tournaments.filter(t => t.status === 'registering');
  const runningTournaments = tournaments.filter(t => t.status === 'running');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏆 Gestionnaire de Tournois</h2>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="card mb-4">
        <div className="card-body">
          <h5>💡 Instructions</h5>
          <ul className="mb-0">
            <li><strong>Tournois "running":</strong> Cliquez pour exécuter automatiquement tous les matchs</li>
            <li><strong>Tournois "completed":</strong> Cliquez pour visionner les replays des matchs</li>
            <li><strong>Visualisation:</strong> Chaque match peut être rejoué frame par frame</li>
            <li><strong>Stockage:</strong> Tous les replays sont sauvegardés en base de données</li>
          </ul>
        </div>
      </div>

      {/* Sélectionnez un tournoi pour voir ses matchs */}
      <div className="alert alert-info">
        <h5>Sélectionnez un tournoi pour voir ses matchs</h5>
      </div>

      {/* Tournois en cours d'inscription */}
      {registeringTournaments.length > 0 && (
        <div className="mb-4">
          <h4>📋 Inscriptions ouvertes</h4>
          <div className="row">
            {registeringTournaments.map(tournament => (
              <div key={tournament._id} className="col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{tournament.name}</h5>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <p className="text-muted">Type: {tournament.type} | 🎮 En préparation</p>
                    <p><strong>Participants:</strong> {tournament.participants?.length || 0} / {tournament.maxParticipants}</p>
                    
                    <div className="d-flex gap-2">
                      {tournament.participants?.length >= 2 && (
                        <button
                          className="btn btn-success"
                          onClick={() => startTournament(tournament._id)}
                        >
                          🚀 Démarrer le tournoi
                        </button>
                      )}
                      <button
                        className="btn btn-info"
                        onClick={() => viewTournamentMatches(tournament)}
                      >
                        👁️ Voir détails
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteTournament(tournament._id)}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournois en cours */}
      {runningTournaments.length > 0 && (
        <div className="mb-4">
          <h4>⚡ En cours d'exécution</h4>
          <div className="row">
            {runningTournaments.map(tournament => (
              <div key={tournament._id} className="col-md-6 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{tournament.name}</h5>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <p className="text-muted">Type: {tournament.type} | ⚡ En cours</p>
                    <p><strong>Participants:</strong> {tournament.participants?.length || 0}</p>
                    
                    <button
                      className="btn btn-primary"
                      onClick={() => viewTournamentMatches(tournament)}
                    >
                      📊 Voir les matchs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournois terminés */}
      {completedTournaments.length > 0 && (
        <div className="mb-4">
          <h4>✅ Tournois terminés</h4>
          <div className="row">
            {completedTournaments.map(tournament => (
              <div key={tournament._id} className="col-md-6 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{tournament.name}</h5>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <p className="text-muted">Type: {tournament.type} | ✅ Terminé</p>
                    <p><strong>Participants:</strong> {tournament.participants?.length || 0}</p>
                    
                    <button
                      className="btn btn-primary"
                      onClick={() => viewTournamentMatches(tournament)}
                    >
                      🎬 Voir les replays
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-5">
          <h4 className="text-muted">Aucun tournoi trouvé</h4>
          <p className="text-muted">Créez votre premier tournoi pour commencer !</p>
        </div>
      )}
    </div>
  );
};

export default AdminTournamentManager; 