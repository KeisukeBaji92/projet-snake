import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 8
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      setError('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
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

      if (response.ok) {
        setShowCreateForm(false);
        setNewTournament({ name: '', description: '', maxParticipants: 8 });
        loadTournaments();
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      setError('Erreur lors de la création du tournoi');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      registering: 'bg-primary',
      running: 'bg-warning text-dark',
      completed: 'bg-success'
    };
    
    const labels = {
      registering: 'Inscriptions ouvertes',
      running: 'En cours',
      completed: 'Terminé'
    };

    return (
      <span className={`badge ${badges[status] || 'bg-secondary'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>🏆 Tournois Snake Arena</h1>
            <button 
              className="btn btn-success"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Créer un tournoi
            </button>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Créer un nouveau tournoi</h5>
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
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Max participants</label>
                        <select
                          className="form-select"
                          value={newTournament.maxParticipants}
                          onChange={(e) => setNewTournament({...newTournament, maxParticipants: Number(e.target.value)})}
                        >
                          <option value={4}>4 joueurs</option>
                          <option value={8}>8 joueurs</option>
                          <option value={16}>16 joueurs</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">&nbsp;</label>
                        <div>
                          <button type="submit" className="btn btn-primary me-2">
                            Créer
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => setShowCreateForm(false)}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description (optionnel)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newTournament.description}
                      onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                      placeholder="Décrivez votre tournoi..."
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Liste des tournois */}
          {tournaments.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="text-muted">Aucun tournoi disponible</h3>
              <p className="text-muted">Créez le premier tournoi pour commencer !</p>
            </div>
          ) : (
            <div className="row">
              {tournaments.map(tournament => (
                <div key={tournament._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{tournament.name}</h5>
                        {getStatusBadge(tournament.status)}
                      </div>
                      
                      {tournament.description && (
                        <p className="card-text text-muted small">{tournament.description}</p>
                      )}
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          <strong>Créé par:</strong> {tournament.creator?.username || 'Anonyme'}
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <div className="row text-center">
                          <div className="col-6">
                            <div className="border-end">
                              <div className="fw-bold">{tournament.participants?.length || 0}</div>
                              <small className="text-muted">Participants</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="fw-bold">{tournament.maxParticipants}</div>
                            <small className="text-muted">Max</small>
                          </div>
                        </div>
                      </div>

                      {tournament.winner && (
                        <div className="alert alert-success py-2">
                          <small>
                            🏆 <strong>Gagnant:</strong> {tournament.winner.user?.username}
                          </small>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer bg-transparent">
                      <Link 
                        to={`/tournament/${tournament._id}`}
                        className="btn btn-primary w-100"
                      >
                        {tournament.status === 'registering' ? 'Rejoindre' : 
                         tournament.status === 'running' ? 'Voir le tournoi' : 
                         'Voir les résultats'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentList; 