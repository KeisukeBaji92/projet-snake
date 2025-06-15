import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    loadGlobalStats();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/leaderboard');
      if (!response.ok) throw new Error('Erreur lors du chargement du leaderboard');
      
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError('Impossible de charger le leaderboard');
      console.error(err);
    }
  };

  const loadGlobalStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/leaderboard/stats');
      if (!response.ok) throw new Error('Erreur lors du chargement des stats');
      
      const data = await response.json();
      setGlobalStats(data);
    } catch (err) {
      console.error('Erreur stats globales:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date inconnue';
    }
  };

  const getPodiumHeight = (position) => {
    switch(position) {
      case 1: return '120px';
      case 2: return '100px';
      case 3: return '80px';
      default: return '60px';
    }
  };

  const getPodiumColor = (position) => {
    switch(position) {
      case 1: return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 2: return 'linear-gradient(135deg, #C0C0C0, #A8A8A8)';
      case 3: return 'linear-gradient(135deg, #CD7F32, #B8860B)';
      default: return 'linear-gradient(135deg, #E3E3E3, #CCCCCC)';
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement du classement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="error-message">
          <h3>❌ Erreur</h3>
          <p>{error}</p>
          <button onClick={loadLeaderboard} className="retry-btn">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfPlayers = leaderboard.slice(3);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Classement des Champions</h1>
        <p className="subtitle">
          Découvrez les meilleurs programmeurs de Snake Arena !
        </p>
      </div>

      {/* Statistiques globales */}
      {globalStats && (
        <div className="global-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{globalStats.totalUsers}</div>
            <div className="stat-label">Joueurs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{globalStats.totalScripts}</div>
            <div className="stat-label">Scripts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚔️</div>
            <div className="stat-value">{globalStats.totalMatches}</div>
            <div className="stat-label">Matchs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏟️</div>
            <div className="stat-value">{globalStats.totalTournaments}</div>
            <div className="stat-label">Tournois</div>
          </div>
        </div>
      )}

      {/* Podium Top 3 */}
      {topThree.length > 0 && (
        <div className="podium-section">
          <h2>🥇 Podium des Champions</h2>
          <div className="podium">
            {/* 2ème place */}
            {topThree[1] && (
              <div className="podium-place second-place">
                <div className="podium-player">
                  <div className="player-avatar">
                    <span className="avatar-text">
                      {topThree[1].username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3>{topThree[1].username}</h3>
                  <div className="player-score">{topThree[1].totalScore} pts</div>
                  <div className="player-stats">
                    <span>🏆 {topThree[1].stats.wins}W</span>
                    <span>📊 {topThree[1].winRate}%</span>
                  </div>
                </div>
                <div 
                  className="podium-base"
                  style={{ 
                    height: getPodiumHeight(2),
                    background: getPodiumColor(2)
                  }}
                >
                  <span className="podium-number">2</span>
                </div>
              </div>
            )}

            {/* 1ère place */}
            {topThree[0] && (
              <div className="podium-place first-place">
                <div className="champion-crown">👑</div>
                <div className="podium-player">
                  <div className="player-avatar champion">
                    <span className="avatar-text">
                      {topThree[0].username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3>{topThree[0].username}</h3>
                  <div className="player-score">{topThree[0].totalScore} pts</div>
                  <div className="player-stats">
                    <span>🏆 {topThree[0].stats.wins}W</span>
                    <span>📊 {topThree[0].winRate}%</span>
                  </div>
                </div>
                <div 
                  className="podium-base"
                  style={{ 
                    height: getPodiumHeight(1),
                    background: getPodiumColor(1)
                  }}
                >
                  <span className="podium-number">1</span>
                </div>
              </div>
            )}

            {/* 3ème place */}
            {topThree[2] && (
              <div className="podium-place third-place">
                <div className="podium-player">
                  <div className="player-avatar">
                    <span className="avatar-text">
                      {topThree[2].username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3>{topThree[2].username}</h3>
                  <div className="player-score">{topThree[2].totalScore} pts</div>
                  <div className="player-stats">
                    <span>🏆 {topThree[2].stats.wins}W</span>
                    <span>📊 {topThree[2].winRate}%</span>
                  </div>
                </div>
                <div 
                  className="podium-base"
                  style={{ 
                    height: getPodiumHeight(3),
                    background: getPodiumColor(3)
                  }}
                >
                  <span className="podium-number">3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classement complet */}
      <div className="full-ranking">
        <h2>📊 Classement Complet</h2>
        <div className="ranking-table">
          <div className="table-header">
            <div className="col-rank">#</div>
            <div className="col-player">Joueur</div>
            <div className="col-score">Score</div>
            <div className="col-stats">Statistiques</div>
            <div className="col-performance">Performance</div>
            <div className="col-badges">Badges</div>
          </div>
          
          {leaderboard.map((player, index) => (
            <div 
              key={player._id} 
              className={`table-row ${player.position <= 3 ? 'top-three' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="col-rank">
                <span className={`rank-number rank-${player.position}`}>
                  {player.position}
                </span>
              </div>
              
              <div className="col-player">
                <div className="player-info">
                  <div className="player-avatar-small">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-details">
                    <div className="player-name">{player.username}</div>
                    <div className="player-joined">
                      Inscrit le {formatDate(player.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-score">
                <div className="score-main">{player.totalScore}</div>
                <div className="score-details">
                  <small>+{player.creativityBonus} créativité</small>
                  <small>+{player.activityBonus} activité</small>
                </div>
              </div>
              
              <div className="col-stats">
                <div className="stats-grid">
                  <span className="stat-item win">🏆 {player.stats.wins}</span>
                  <span className="stat-item loss">❌ {player.stats.losses}</span>
                  <span className="stat-item draw">🤝 {player.stats.draws}</span>
                  <span className="stat-item scripts">📝 {player.scriptsCount}</span>
                </div>
              </div>
              
              <div className="col-performance">
                <div className="win-rate">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(player.winRate, 100)}%` }}
                    ></div>
                  </div>
                  <span>{player.winRate}% victoires</span>
                </div>
                <div className="recent-form">
                  Forme: {player.recentForm}/5
                </div>
              </div>
              
              <div className="col-badges">
                {player.badge && (
                  <span 
                    className="badge"
                    style={{ borderColor: player.badgeColor }}
                  >
                    {player.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="empty-leaderboard">
          <div className="empty-icon">🏆</div>
          <h3>Aucun joueur classé</h3>
          <p>Soyez le premier à rejoindre la compétition !</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 