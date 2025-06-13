import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Tournaments.css';

const Tournaments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [userScripts, setUserScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 8,
    difficulty: 'normal',
    type: 'round_robin'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournaments();
    if (user) {
      loadUserScripts();
    }
  }, [user]);

  const loadTournaments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois:', error);
      setError('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const loadUserScripts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/scripts/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des scripts');
      }
      const data = await response.json();
      setUserScripts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des scripts:', error);
      setError('Erreur lors du chargement des scripts');
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTournament)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du tournoi');
      }

      setShowCreateForm(false);
      setNewTournament({
        name: '',
        description: '',
        maxParticipants: 8,
        difficulty: 'normal',
        type: 'elimination'
      });
      loadTournaments();
    } catch (error) {
      console.error('Erreur lors de la création du tournoi:', error);
      setError('Erreur lors de la création du tournoi');
    }
  };

  const handleRegister = async (tournamentId) => {
    if (!selectedScript) {
      setError('Veuillez sélectionner un script');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scriptId: selectedScript })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'inscription au tournoi');
      }

      loadTournaments();
      setSelectedScript('');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setError('Erreur lors de l\'inscription au tournoi');
    }
  };

  const handleStartTournament = async (tournamentId) => {
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
      
      // Afficher le succès
      setError(`✅ ${result.message}`);
      
      // Recharger les tournois
      loadTournaments();
    } catch (error) {
      console.error('Erreur lors du démarrage du tournoi:', error);
      setError(`❌ Erreur lors du démarrage: ${error.message}`);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du tournoi');
      }

      loadTournaments();
    } catch (error) {
      console.error('Erreur lors de la suppression du tournoi:', error);
      setError('Erreur lors de la suppression du tournoi');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      registering: { text: 'Inscriptions ouvertes', class: 'status-registering' },
      running: { text: 'En cours', class: 'status-running' },
      completed: { text: 'Terminé', class: 'status-completed' }
    };
    
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      normal: { text: 'Normal', class: 'difficulty-normal' },
      hard: { text: 'Difficile', class: 'difficulty-hard' }
    };
    
    const badge = badges[difficulty] || { text: difficulty, class: 'difficulty-default' };
    return <span className={`difficulty-badge ${badge.class}`}>{badge.text}</span>;
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

  const viewMatchReplay = (match) => {
    navigate(`/test-match`, { state: { preselectedMatch: match } });
  };

  const isUserRegistered = (tournament) => {
    return user && tournament.participants.some(p => p.user._id === user.id);
  };

  if (loading) {
    return <div className="loading">Chargement des tournois...</div>;
  }

  // Vue des matchs d'un tournoi sélectionné
  if (selectedTournament) {
    return (
      <div className="tournaments-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSelectedTournament(null);
              setMatches([]);
            }}
          >
            ← Retour aux tournois
          </button>
          <h2>🏆 {selectedTournament.name}</h2>
          {getStatusBadge(selectedTournament.status)}
        </div>

        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <p><strong>Description:</strong> {selectedTournament.description}</p>
                <p><strong>Participants:</strong> {selectedTournament.participants?.length || 0}</p>
                <p><strong>Type:</strong> {selectedTournament.type}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">👥 Participants</div>
              <div className="card-body">
                {selectedTournament.participants?.map((participant, index) => (
                  <div key={index} className="d-flex justify-content-between mb-2">
                    <span className="fw-bold">{participant.user?.username}</span>
                    <span className="text-muted">{participant.script?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
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

  // Debug
  console.log('User:', user);
  console.log('Is admin:', user?.role === 'admin');

  return (
    <div className="tournaments-container">
      <h2>Tournois</h2>
      {error && (
        <div className={`alert ${error.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
          {error}
        </div>
      )}



      {user?.role === 'admin' && (
        <div className="admin-controls mb-4">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Annuler' : 'Créer un nouveau tournoi'}
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateTournament} className="create-tournament-form mt-3">
              <div className="mb-3">
                <label className="form-label">Nom du tournoi</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Nombre maximum de participants</label>
                <input
                  type="number"
                  className="form-control"
                  value={newTournament.maxParticipants}
                  onChange={(e) => setNewTournament({...newTournament, maxParticipants: parseInt(e.target.value)})}
                  min="2"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Difficulté</label>
                <select
                  className="form-control"
                  value={newTournament.difficulty}
                  onChange={(e) => setNewTournament({...newTournament, difficulty: e.target.value})}
                >
                  <option value="normal">Normal</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Type de tournoi</label>
                <select
                  className="form-control"
                  value={newTournament.type}
                  onChange={(e) => setNewTournament({...newTournament, type: e.target.value})}
                >
                  <option value="round_robin">Round Robin (Tous contre tous)</option>
                </select>
                <small className="form-text text-muted">
                  En mode Round Robin, chaque participant joue contre tous les autres.
                  Pour N participants : {newTournament.maxParticipants} × {newTournament.maxParticipants - 1} ÷ 2 = {Math.floor(newTournament.maxParticipants * (newTournament.maxParticipants - 1) / 2)} matchs maximum
                </small>
              </div>
              <button type="submit" className="btn btn-success">Créer le tournoi</button>
            </form>
          )}
        </div>
      )}

      <div className="tournaments-list">
        {tournaments.length === 0 ? (
          <p>Aucun tournoi disponible pour le moment.</p>
        ) : (
          tournaments.map(tournament => (
            <div key={tournament._id} className="tournament-card">
              <div className="tournament-header">
                <h3>{tournament.name}</h3>
                {getStatusBadge(tournament.status)}
                {getDifficultyBadge(tournament.settings.difficulty)}
              </div>
              
              <div className="tournament-info">
                <p>{tournament.description}</p>
                <p>Participants: {tournament.participants.length} / {tournament.maxParticipants}</p>
                <p>Type: {tournament.type}</p>
              </div>

              {user && tournament.status === 'registering' && !isUserRegistered(tournament) && (
                <div className="tournament-actions">
                  <select
                    className="form-control mb-2"
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                  >
                    <option value="">Sélectionner un script</option>
                    {userScripts.map(script => (
                      <option key={script._id} value={script._id}>
                        {script.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRegister(tournament._id)}
                  >
                    S'inscrire
                  </button>
                </div>
              )}

              {user?.role === 'admin' && (
                <div className="admin-actions mt-3">
                  {tournament.status === 'registering' && tournament.participants.length >= 2 && (
                    <button
                      className="btn btn-success me-2"
                      onClick={() => handleStartTournament(tournament._id)}
                    >
                      🚀 Démarrer le tournoi
                    </button>
                  )}
                  {(tournament.status === 'completed' || tournament.status === 'running') && (
                    <button
                      className="btn btn-primary me-2"
                      onClick={() => viewTournamentMatches(tournament)}
                    >
                      🎬 Voir les matchs/replays
                    </button>
                  )}
                  {tournament.status === 'registering' && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteTournament(tournament._id)}
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tournaments; 