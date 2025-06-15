import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TournamentList.css';

const TournamentList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [userScripts, setUserScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showActive, setShowActive] = useState(true);
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
    // Navigation vers la page de détail du tournoi
    navigate(`/tournament/${tournament._id}`);
  };

  const viewMatchReplay = (match) => {
    // Cette fonctionnalité sera gérée dans TournamentDetail
    console.log('Viewing replay for match:', match._id);
  };

  const isUserRegistered = (tournament) => {
    if (!user || !tournament.participants) return false;
    return tournament.participants.some(p => p.user._id === user.id);
  };

  const getFilteredTournaments = () => {
    return tournaments.filter(tournament => {
      const isCompleted = tournament.status === 'completed';
      const isActive = tournament.status === 'registering' || tournament.status === 'running';
      
      if (isCompleted && !showCompleted) return false;
      if (isActive && !showActive) return false;
      
      return true;
    });
  };

  if (loading) {
    return (
      <div className="tournaments-container">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des tournois...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tournaments-container">
      <div className="tournaments-header">
        <h1>🏆 Tournois Snake Arena</h1>
        <p className="subtitle">Participez aux compétitions et montrez vos compétences !</p>
        
        {/* Filtres d'affichage */}
        <div className="filter-controls">
          <div className="btn-group" role="group" aria-label="Filtres de tournois">
            <button 
              type="button" 
              className={`btn ${showActive ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setShowActive(!showActive)}
            >
              {showActive ? '✅ Afficher' : '❌ Masquer'} Tournois Actifs ({tournaments.filter(t => t.status === 'registering' || t.status === 'running').length})
            </button>
            <button 
              type="button" 
              className={`btn ${showCompleted ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? '✅ Afficher' : '❌ Masquer'} Tournois Terminés ({tournaments.filter(t => t.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Bouton créer tournoi (admin) */}
      {user?.role === 'admin' && (
        <div className="admin-section">
          <button 
            className="btn btn-primary btn-lg mb-4"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            ➕ Créer un nouveau tournoi
          </button>

          {showCreateForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Créer un nouveau tournoi</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateTournament}>
                  <div className="row">
                    <div className="col-md-6">
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
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nombre max de participants</label>
                        <select
                          className="form-select"
                          value={newTournament.maxParticipants}
                          onChange={(e) => setNewTournament({...newTournament, maxParticipants: parseInt(e.target.value)})}
                        >
                          <option value={4}>4 joueurs</option>
                          <option value={8}>8 joueurs</option>
                          <option value={16}>16 joueurs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Difficulté</label>
                        <select
                          className="form-select"
                          value={newTournament.difficulty}
                          onChange={(e) => setNewTournament({...newTournament, difficulty: e.target.value})}
                        >
                          <option value="normal">Normal</option>
                          <option value="hard">Difficile (avec bombes)</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select
                          className="form-select"
                          value={newTournament.type}
                          onChange={(e) => setNewTournament({...newTournament, type: e.target.value})}
                        >
                          <option value="round_robin">Round Robin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTournament.description}
                      onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                      placeholder="Description du tournoi..."
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">Créer le tournoi</button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des tournois */}
      <div className="tournaments-grid">
        {getFilteredTournaments().length > 0 ? (
          getFilteredTournaments().map(tournament => (
            <div key={tournament._id} className="tournament-card">
              <div className="tournament-header">
                <h3 className="tournament-title">{tournament.name}</h3>
                <div className="tournament-badges">
                  {getStatusBadge(tournament.status)}
                  {getDifficultyBadge(tournament.settings?.difficulty || 'normal')}
                </div>
              </div>

              <div className="tournament-body">
                <p className="tournament-description">
                  {tournament.description || 'Aucune description'}
                </p>

                <div className="tournament-info">
                  <div className="info-item">
                    <span className="info-label">Participants:</span>
                    <span className="info-value">
                      {tournament.participants?.length || 0} / {tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{tournament.type}</span>
                  </div>
                  {tournament.created && (
                    <div className="info-item">
                      <span className="info-label">Créé le:</span>
                      <span className="info-value">
                        {new Date(tournament.created).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Participants inscrits */}
                {tournament.participants && tournament.participants.length > 0 && (
                  <div className="participants-preview">
                    <h6>Participants inscrits:</h6>
                    <div className="participants-list">
                      {tournament.participants.slice(0, 3).map((participant, index) => (
                        <span key={index} className="participant-badge">
                          {participant.user?.username}
                        </span>
                      ))}
                      {tournament.participants.length > 3 && (
                        <span className="participant-badge more">
                          +{tournament.participants.length - 3} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="tournament-actions">
                {/* Inscription */}
                {tournament.status === 'registering' && user && !isUserRegistered(tournament) && (
                  <div className="registration-section">
                    <select 
                      className="form-select form-select-sm mb-2"
                      value={selectedScript}
                      onChange={(e) => setSelectedScript(e.target.value)}
                    >
                      <option value="">Choisir un script</option>
                      {userScripts.map(script => (
                        <option key={script._id} value={script._id}>
                          {script.name}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => handleRegister(tournament._id)}
                      disabled={!selectedScript}
                    >
                      S'inscrire
                    </button>
                  </div>
                )}

                {/* Utilisateur déjà inscrit */}
                {tournament.status === 'registering' && user && isUserRegistered(tournament) && (
                  <div className="alert alert-success p-2 mb-2">
                    ✅ Vous êtes inscrit !
                  </div>
                )}

                {/* Actions admin */}
                {user?.role === 'admin' && (
                  <div className="admin-actions">
                    {tournament.status === 'registering' && tournament.participants?.length >= 2 && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleStartTournament(tournament._id)}
                      >
                        🚀 Démarrer
                      </button>
                    )}
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={() => viewTournamentMatches(tournament)}
                    >
                      📋 Détails
                    </button>
                    {(tournament.status === 'registering' || tournament.status === 'completed') && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTournament(tournament._id)}
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                )}

                {/* Action utilisateur normal */}
                {user?.role !== 'admin' && (
                  <button 
                    className="btn btn-outline-info btn-sm w-100"
                    onClick={() => viewTournamentMatches(tournament)}
                  >
                    📋 Voir les détails
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏟️</div>
            {tournaments.length === 0 ? (
              <>
                <h3>Aucun tournoi disponible</h3>
                <p>Il n'y a actuellement aucun tournoi. Revenez plus tard !</p>
                {user?.role === 'admin' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Créer le premier tournoi
                  </button>
                )}
              </>
            ) : (
              <>
                <h3>Aucun tournoi affiché</h3>
                <p>Tous les tournois sont masqués par vos filtres. Ajustez les filtres ci-dessus pour voir les tournois.</p>
                <div className="mt-3">
                  <button 
                    className="btn btn-outline-primary me-2"
                    onClick={() => setShowActive(true)}
                  >
                    ✅ Afficher les tournois actifs
                  </button>
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => setShowCompleted(true)}
                  >
                    ✅ Afficher les tournois terminés
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList; 