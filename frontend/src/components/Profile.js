import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
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
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          console.error('Erreur lors de la récupération du profil');
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

      {/* Prochaines sections à venir */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="text-muted">
                <i className="fas fa-construction me-2"></i>
                Autres sections en cours de développement...
              </h5>
              <p className="text-muted mb-0">
                Statistiques de jeu, classement global et plus encore bientôt disponibles !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 