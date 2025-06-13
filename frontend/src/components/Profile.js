import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date non disponible';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (role) => {
    return role === 'admin' ? 'Administrateur' : 'Joueur';
  };

  const getStatusIcon = (role) => {
    return role === 'admin' ? '👑' : '🎮';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // Récupérer le profil de base
        const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileData(profileData);
        }

        // Récupérer les statistiques
        const statsResponse = await fetch('http://localhost:5000/api/auth/profile/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setProfileStats(statsData);
        }

      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Vous devez être connecté pour voir votre profil.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = profileData || user;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">
            <i className="fas fa-user-circle me-2"></i>
            Mon Profil
          </h1>
        </div>
      </div>

      {/* Section 1: Informations Générales */}
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Informations Générales
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="profile-info-item">
                    <label className="profile-label">
                      <i className="fas fa-user me-2"></i>
                      Nom d'utilisateur
                    </label>
                    <div className="profile-value">{currentUser.username}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="profile-info-item">
                    <label className="profile-label">
                      <i className="fas fa-calendar-alt me-2"></i>
                      Date d'inscription
                    </label>
                    <div className="profile-value">
                      {formatDate(currentUser.created)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="profile-info-item">
                    <label className="profile-label">
                      <i className="fas fa-crown me-2"></i>
                      Statut
                    </label>
                    <div className="profile-value">
                      <span className={`badge ${currentUser.role === 'admin' ? 'bg-warning text-dark' : 'bg-info'} fs-6`}>
                        {getStatusIcon(currentUser.role)} {getStatusLabel(currentUser.role)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Statistiques de Jeu */}
      {profileStats && (
        <div className="row">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Statistiques de Jeu
                </h4>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Tournois */}
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-trophy me-2"></i>
                        Tournois joués
                      </label>
                      <div className="profile-value">{profileStats.tournaments.played}</div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-crown me-2"></i>
                        Tournois gagnés
                      </label>
                      <div className="profile-value">{profileStats.tournaments.won}</div>
                    </div>
                  </div>

                  {/* Matchs */}
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-gamepad me-2"></i>
                        Victoires
                      </label>
                      <div className="profile-value">{profileStats.matches.wins}</div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-times-circle me-2"></i>
                        Défaites
                      </label>
                      <div className="profile-value">{profileStats.matches.losses}</div>
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-percentage me-2"></i>
                        Ratio victoire/défaite
                      </label>
                      <div className="profile-value">
                        <span className={`badge fs-6 ${
                          profileStats.matches.winRate >= 70 ? 'bg-success' :
                          profileStats.matches.winRate >= 50 ? 'bg-warning text-dark' :
                          'bg-danger'
                        }`}>
                          {profileStats.matches.winRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-code me-2"></i>
                        Nombre de scripts
                      </label>
                      <div className="profile-value">{profileStats.scripts.count}</div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-apple-alt me-2"></i>
                        Record de pommes
                      </label>
                      <div className="profile-value">{profileStats.records.maxScore}</div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-stopwatch me-2"></i>
                        Plus long combat
                      </label>
                      <div className="profile-value">
                        {profileStats.records.longestMatch > 0 
                          ? `${Math.round(profileStats.records.longestMatch / 1000)}s`
                          : '0s'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="profile-info-item">
                      <label className="profile-label">
                        <i className="fas fa-medal me-2"></i>
                        Classement global
                      </label>
                      <div className="profile-value">
                        <span className={`badge fs-6 ${
                          profileStats.ranking.globalRank === 1 ? 'bg-warning text-dark' :
                          profileStats.ranking.globalRank <= 3 ? 'bg-success' :
                          profileStats.ranking.globalRank <= 10 ? 'bg-info' :
                          'bg-secondary'
                        }`}>
                          #{profileStats.ranking.globalRank}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prochaines sections à venir */}
      {!profileStats && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <h5 className="text-muted">
                  <i className="fas fa-construction me-2"></i>
                  Chargement des statistiques...
                </h5>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 