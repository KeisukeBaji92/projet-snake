import React, { useState, useEffect } from 'react';
import TournamentMatchViewer from './TournamentMatchViewer';

const TestTournamentMatch = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
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
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des tournois');
      setLoading(false);
    }
  };

  const selectTournament = async (tournament) => {
    if (tournament.participants.length < 2) {
      alert('Ce tournoi n\'a pas assez de participants pour simuler un match');
      return;
    }

    // Charger les détails complets du tournoi avec les scripts
    try {
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournament._id}`);
      const fullTournament = await response.json();
      
      // Populer les scripts
      const populatedParticipants = await Promise.all(
        fullTournament.participants.map(async (participant) => {
          const scriptResponse = await fetch(`http://localhost:5000/api/scripts/debug/all`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const scriptsData = await scriptResponse.json();
          const script = scriptsData.scripts.find(s => s.authorId === participant.user);
          
          return {
            ...participant,
            script: script ? {
              _id: participant.script,
              name: script.name,
              code: `function nextMove(state) {
                // Script de démonstration
                const head = state.me[0];
                const food = state.food;
                
                if (food && food.y < head.y) return 'left';
                if (food && food.y > head.y) return 'right';
                if (food && food.x < head.x) return 'up';
                return 'down';
              }`
            } : null
          };
        })
      );

      setSelectedTournament({
        ...fullTournament,
        participants: populatedParticipants
      });
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError('Erreur lors du chargement des détails du tournoi');
    }
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

  if (selectedTournament) {
    return (
      <div>
        <div className="container my-4">
          <button 
            className="btn btn-secondary mb-3"
            onClick={() => setSelectedTournament(null)}
          >
            ← Retour aux tournois
          </button>
        </div>
        
        <TournamentMatchViewer
          tournamentId={selectedTournament._id}
          participant1={selectedTournament.participants[0]}
          participant2={selectedTournament.participants[1]}
          isLive={true}
        />
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h2>Test de Simulation de Match</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5>Sélectionnez un tournoi pour simuler un match</h5>
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
                  disabled={tournament.participants?.length < 2}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{tournament.name}</h6>
                    <small className={
                      tournament.participants?.length >= 2 ? 'text-success' : 'text-danger'
                    }>
                      {tournament.participants?.length || 0} participants
                    </small>
                  </div>
                  <p className="mb-1">{tournament.description}</p>
                  <small className="text-muted">
                    Statut: {tournament.status} | 
                    Type: {tournament.type} |
                    {tournament.participants?.length >= 2 ? 
                      ' ✅ Prêt pour simulation' : 
                      ' ❌ Pas assez de participants'
                    }
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
            <li>Sélectionnez un tournoi qui a au moins 2 participants inscrits</li>
            <li>Le match sera simulé en direct avec leurs scripts</li>
            <li>Vous verrez le jeu se dérouler comme dans le bac à sable</li>
            <li>Le résultat sera affiché à la fin du match</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestTournamentMatch; 