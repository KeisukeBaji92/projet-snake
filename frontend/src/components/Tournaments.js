import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Tournaments.css';

const Tournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [userScripts, setUserScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 8,
    difficulty: 'normal',
    type: 'elimination'
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du tournoi');
      }

      loadTournaments();
    } catch (error) {
      console.error('Erreur lors du démarrage du tournoi:', error);
      setError('Erreur lors du démarrage du tournoi');
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

  const isUserRegistered = (tournament) => {
    return user && tournament.participants.some(p => p.user._id === user.id);
  };

  if (loading) {
    return <div className="loading">Chargement des tournois...</div>;
  }

  // Debug
  console.log('User:', user);
  console.log('Is admin:', user?.role === 'admin');

  return (
    <div className="tournaments-container">
      <h2>Tournois</h2>
      {error && <div className="alert alert-danger">{error}</div>}



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
                  <option value="elimination">Élimination directe</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="swiss">Système suisse</option>
                </select>
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
                      Démarrer le tournoi
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteTournament(tournament._id)}
                  >
                    Supprimer
                  </button>
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