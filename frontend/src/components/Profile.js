import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadUserStats();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du profil');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Impossible de charger les informations du profil');
    }
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/scripts/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const scripts = await response.json();
        setUserStats({
          scriptsCount: scripts.length,
          lastActivity: scripts.length > 0 ? scripts[0].created : null
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return {
        text: 'Administrateur',
        icon: '👑',
        class: 'role-admin'
      };
    }
    return {
      text: 'Joueur',
      icon: '🎮',
      class: 'role-user'
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Non disponible';
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="alert alert-danger" role="alert">
          <h4>Erreur</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleBadge(user?.role || 'user');
  const data = profileData || user;

  return (
    <div className="profile-container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* En-tête du profil */}
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-text">
                {(data?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {roleInfo.icon} {data?.username || 'Utilisateur'}
              </h1>
              <span className={`role-badge ${roleInfo.class}`}>
                {roleInfo.text}
              </span>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="profile-section">
            <div className="card">
              <div className="card-header">
                <h3>📋 Informations personnelles</h3>
              </div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom d'utilisateur</label>
                    <span>{data?.username || 'Non défini'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{data?.email || 'Non défini'}</span>
                  </div>
                  <div className="info-item">
                    <label>Rôle</label>
                    <span className={`role-text ${roleInfo.class}`}>
                      {roleInfo.icon} {roleInfo.text}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Inscrit le</label>
                    <span>{formatDate(data?.created)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="profile-section">
            <div className="card">
              <div className="card-header">
                <h3>📊 Statistiques</h3>
              </div>
              <div className="card-body">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{data?.stats?.wins || 0}</div>
                    <div className="stat-label">Victoires</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-value">{data?.stats?.losses || 0}</div>
                    <div className="stat-label">Défaites</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🤝</div>
                    <div className="stat-value">{data?.stats?.draws || 0}</div>
                    <div className="stat-label">Égalités</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{userStats?.scriptsCount || 0}</div>
                    <div className="stat-label">Scripts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className="profile-section">
            <div className="card">
              <div className="card-header">
                <h3>⏱️ Activité récente</h3>
              </div>
              <div className="card-body">
                <div className="activity-item">
                  <span className="activity-label">Dernière connexion:</span>
                  <span className="activity-value">Maintenant</span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Dernier script créé:</span>
                  <span className="activity-value">
                    {formatDate(userStats?.lastActivity)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions administrateur */}
          {user?.role === 'admin' && (
            <div className="profile-section">
              <div className="card border-warning">
                <div className="card-header bg-warning text-dark">
                  <h3>👑 Actions d'administration</h3>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3">
                    En tant qu'administrateur, vous avez accès à des fonctionnalités spéciales.
                  </p>
                  <div className="admin-actions">
                    <button 
                      className="btn btn-outline-primary me-2"
                      onClick={() => navigate('/replays')}
                    >
                      🎬 Replays
                    </button>
                    <button 
                      className="btn btn-outline-info me-2"
                      onClick={() => navigate('/leaderboard')}
                    >
                      📊 Leaderboard
                    </button>
                    <button 
                      className="btn btn-outline-success"
                      onClick={() => navigate('/tournaments')}
                    >
                      🏟️ Gestion Tournois
                    </button>
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

export default Profile; 