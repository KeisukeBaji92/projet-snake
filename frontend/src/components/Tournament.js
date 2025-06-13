import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReplayViewer from './ReplayViewer';

const Tournament = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userScripts, setUserScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournament();
    loadUserScripts();
  }, [id]);

  const loadTournament = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}`);
      const data = await response.json();
      setTournament(data);
      
      // Charger les matchs si le tournoi est démarré
      if (data.status === 'running' || data.status === 'completed') {
        loadMatches();
      }
    } catch (error) {
      setError('Erreur lors du chargement du tournoi');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/matches`);
      const data = await response.json();
      // Aplatir les matchs par phase
      const allMatches = Object.values(data).flat();
      setMatches(allMatches);
    } catch (error) {
      console.error('Erreur chargement matchs:', error);
    }
  };

  const loadUserScripts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5000/api/scripts/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUserScripts(data);
    } catch (error) {
      console.error('Erreur chargement scripts:', error);
    }
  };

  const handleRegister = async () => {
    if (!selectedScript) {
      setError('Sélectionnez un script');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scriptId: selectedScript })
      });

      if (response.ok) {
        loadTournament();
        setSelectedScript('');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (error) {
      setError('Erreur lors de l\'inscription');
    }
  };

    const handleStartTournament = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Démarrer et exécuter le tournoi en une seule fois
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/start`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du démarrage');
      }

      loadTournament();
      loadMatches();
    } catch (error) {
      console.error('Erreur démarrage tournoi:', error);
      setError(error.message || 'Erreur lors du démarrage du tournoi');
    }
  };



  if (loading) {
    return <div className="container mt-5"><h3>Chargement...</h3></div>;
  }

  if (!tournament) {
    return <div className="container mt-5"><div className="alert alert-danger">Tournoi non trouvé</div></div>;
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <h1>{tournament.name}</h1>
          <p className="text-muted">{tournament.description}</p>
          
          <div className="mb-3">
            <span className={`badge ${
              tournament.status === 'registering' ? 'bg-primary' :
              tournament.status === 'running' ? 'bg-warning' :
              tournament.status === 'completed' ? 'bg-success' : 'bg-secondary'
            }`}>
              {tournament.status === 'registering' ? 'Inscriptions ouvertes' :
               tournament.status === 'running' ? 'En cours' :
               tournament.status === 'completed' ? 'Terminé' : tournament.status}
            </span>
            <span className="ms-2 text-muted">
              {tournament.participants?.length || 0}/{tournament.maxParticipants} participants
            </span>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Section d'inscription */}
          {tournament.status === 'registering' && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">S'inscrire au tournoi</h5>
                <div className="row">
                  <div className="col-md-6">
                    <select 
                      className="form-select" 
                      value={selectedScript} 
                      onChange={(e) => setSelectedScript(e.target.value)}
                    >
                      <option value="">Choisir un script</option>
                      {userScripts.map(script => (
                        <option key={script._id} value={script._id}>
                          {script.name} - {script.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleRegister}
                      disabled={!selectedScript}
                    >
                      S'inscrire
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton démarrer tournoi (admin) */}
          {tournament.status === 'registering' && tournament.participants?.length >= 2 && (
            <div className="mb-4">
              <button 
                className="btn btn-success btn-lg"
                onClick={handleStartTournament}
              >
                🚀 Démarrer le tournoi
              </button>
            </div>
          )}

          {/* Liste des participants */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Participants</h5>
              {tournament.participants && tournament.participants.length > 0 ? (
                <div className="list-group">
                  {tournament.participants.map((participant, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{participant.user?.username}</strong>
                        <br />
                        <small className="text-muted">{participant.script?.name}</small>
                      </div>
                      {tournament.winner && tournament.winner.user === participant.user._id && (
                        <span className="badge bg-warning">🏆 Gagnant</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Aucun participant inscrit</p>
              )}
            </div>
          </div>

          {/* Matchs et replays */}
          {matches.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Matchs du tournoi</h5>
                <div className="row">
                  {matches.map((match, index) => (
                    <div key={match._id} className="col-md-6 mb-3">
                      <div className="card border-secondary">
                        <div className="card-body">
                          <h6 className="card-title">{match.phase} - Match #{index + 1}</h6>
                          <div className="mb-2">
                            {match.participants.map((participant, pIndex) => (
                              <div 
                                key={pIndex} 
                                className={`d-flex justify-content-between align-items-center ${
                                  match.result?.winner?.user === participant.user._id ? 'fw-bold text-success' : ''
                                }`}
                              >
                                <span className={`badge bg-${participant.color} me-2`}>
                                  {participant.color}
                                </span>
                                <span className="flex-grow-1">{participant.user?.username}</span>
                                {match.result?.finalScores && (
                                  <span className="badge bg-light text-dark">
                                    {participant.color === 'red' ? 
                                      match.result.finalScores.red : 
                                      match.result.finalScores.blue}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {match.status === 'completed' && (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => setSelectedMatch(match)}
                            >
                              📺 Voir le replay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Replay du match sélectionné */}
          {selectedMatch && (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-body">
                    <ReplayViewer 
                      replayData={selectedMatch.replay}
                      onClose={() => setSelectedMatch(null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tournament; 