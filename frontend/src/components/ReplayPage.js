import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TournamentMatchViewer from './TournamentMatchViewer';

const ReplayPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}`);
      
      if (!response.ok) {
        throw new Error('Match non trouvé');
      }

      const matchData = await response.json();
      setMatch(matchData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement du replay...</span>
          </div>
          <p className="mt-2">Chargement du replay...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error}</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning">
          <h5>Match non trouvé</h5>
          <p>Le match demandé n'existe pas ou n'est plus disponible.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container my-4">
        <button 
          className="btn btn-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>
      </div>
      
      <TournamentMatchViewer
        match={match}
        isReplay={true}
      />
    </div>
  );
};

export default ReplayPage; 