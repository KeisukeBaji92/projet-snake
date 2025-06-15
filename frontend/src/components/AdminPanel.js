import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
      loadStats();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?\n\nCette action est irréversible et supprimera également tous ses scripts.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      const data = await response.json();
      setSuccess(data.message);
      setError('');
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      await loadStats();

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
      setSuccess('');
    }
  };

  const changeUserRole = async (userId, currentRole, username) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!window.confirm(`Changer le rôle de "${username}" de "${currentRole}" vers "${newRole}" ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modification du rôle');
      }

      const data = await response.json();
      setSuccess(data.message);
      setError('');
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      await loadStats();

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
      setSuccess('');
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? (
      <span className="badge bg-warning text-dark">👑 Admin</span>
    ) : (
      <span className="badge bg-primary">🎮 Joueur</span>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Cette section est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du panneau d'administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👑 Panneau d'Administration</h1>
        <p>Gestion complète de la plateforme Snake Arena</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Navigation par onglets */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Onglet Utilisateurs */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h3>👥 Gestion des Utilisateurs</h3>
            <span className="user-count">{users.length} utilisateur(s) inscrit(s)</span>
          </div>

          <div className="users-table">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Inscription</th>
                    <th>Scripts</th>
                    <th>Tournois</th>
                    <th>Matchs</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem._id} className={userItem._id === user.id ? 'current-user' : ''}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {userItem.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="username">{userItem.username}</span>
                          {userItem._id === user.id && <small className="text-muted">(Vous)</small>}
                        </div>
                      </td>
                      <td>{userItem.email}</td>
                      <td>{getRoleBadge(userItem.role)}</td>
                      <td>
                        <small>{formatDate(userItem.created)}</small>
                      </td>
                      <td>
                        <span className="stat-badge scripts">{userItem.scriptsCount}</span>
                      </td>
                      <td>
                        <span className="stat-badge tournaments">{userItem.tournamentsCount}</span>
                      </td>
                      <td>
                        <span className="stat-badge matches">{userItem.totalMatches}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {userItem._id !== user.id && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-warning me-1"
                                onClick={() => changeUserRole(userItem._id, userItem.role, userItem.username)}
                                title={`Changer le rôle (actuellement ${userItem.role})`}
                              >
                                {userItem.role === 'admin' ? '👤' : '👑'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteUser(userItem._id, userItem.username)}
                                title="Supprimer cet utilisateur"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {userItem._id === user.id && (
                            <span className="text-muted small">Actions non disponibles</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Statistiques */}
      {activeTab === 'stats' && stats && (
        <div className="admin-section">
          <div className="section-header">
            <h3>📊 Statistiques de la Plateforme</h3>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Utilisateurs Total</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👑</div>
              <div className="stat-value">{stats.totalAdmins}</div>
              <div className="stat-label">Administrateurs</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{stats.totalScripts}</div>
              <div className="stat-label">Scripts Créés</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏟️</div>
              <div className="stat-value">{stats.totalTournaments}</div>
              <div className="stat-label">Tournois</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⚔️</div>
              <div className="stat-value">{stats.totalMatches}</div>
              <div className="stat-label">Matchs Joués</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🆕</div>
              <div className="stat-value">{stats.recentUsers}</div>
              <div className="stat-label">Nouveaux (7j)</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{stats.activeTournaments}</div>
              <div className="stat-label">Tournois Actifs</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{stats.averageScriptsPerUser}</div>
              <div className="stat-label">Scripts/Utilisateur</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
