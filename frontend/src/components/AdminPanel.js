import React, { useState, useEffect } from 'react';
import AdminTournamentManager from './AdminTournamentManager';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userScripts, setUserScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'tournaments') {
      loadTournaments();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/tournaments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tournois');
      }

      const data = await response.json();
      setTournaments(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadUserScripts = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/scripts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des scripts');
      }

      const data = await response.json();
      setUserScripts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ? Cette action supprimera également tous ses scripts et l'retirera des tournois en cours d'inscription.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const result = await response.json();
      setSuccessMessage(`Utilisateur "${result.deletedUser.username}" supprimé avec succès`);
      await loadUsers();

      // Fermer la vue détaillée si c'était l'utilisateur sélectionné
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(null);
        setUserScripts([]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteScript = async (userId, scriptId) => {
    const script = userScripts.find(s => s._id === scriptId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le script "${script.name}" ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const result = await response.json();
      setSuccessMessage(`Script "${result.deletedScript.name}" supprimé avec succès`);
      await loadUserScripts(userId);
      await loadUsers(); // Recharger pour mettre à jour le compteur de scripts
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFromTournament = async (tournamentId, userId) => {
    const tournament = tournaments.find(t => t._id === tournamentId);
    const participant = tournament.participants.find(p => p.user._id === userId);
    
    if (!window.confirm(`Êtes-vous sûr de vouloir désinscrire "${participant.user.username}" du tournoi "${tournament.name}" ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/tournaments/${tournamentId}/participants/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la désinscription');
      }

      const result = await response.json();
      setSuccessMessage(`${result.removedUser} désinscrit du tournoi "${result.tournament}"`);
      await loadTournaments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewUserScripts = async (user) => {
    setSelectedUser(user);
    await loadUserScripts(user._id);
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="admin-title">🛠️ Panneau d'Administration</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={clearMessages}></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible" role="alert">
            {successMessage}
            <button type="button" className="btn-close" onClick={clearMessages}></button>
          </div>
        )}

        {/* Navigation Tabs */}
        <ul className="nav nav-tabs nav-pills mb-4" id="adminTabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Gestion des Utilisateurs
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'tournaments' ? 'active' : ''}`}
              onClick={() => setActiveTab('tournaments')}
            >
              🏆 Gestion des Tournois
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveTab('manager')}
            >
              ⚡ Manager de Tournois
            </button>
          </li>
        </ul>

        {/* Contenu des onglets */}
        <div className="tab-content">
          
          {/* Onglet Gestion des Utilisateurs */}
          {activeTab === 'users' && (
            <div className="tab-pane active">
              <div className="row">
                {/* Liste des utilisateurs */}
                <div className={selectedUser ? 'col-md-8' : 'col-12'}>
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5>👥 Utilisateurs Inscrits ({users.length})</h5>
                      <button className="btn btn-outline-primary btn-sm" onClick={loadUsers}>
                        🔄 Actualiser
                      </button>
                    </div>
                    <div className="card-body">
                      {users.length === 0 ? (
                        <div className="text-center text-muted py-5">
                          <h6>Aucun utilisateur trouvé</h6>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Utilisateur</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Scripts</th>
                                <th>Tournois</th>
                                <th>Inscrit le</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map(user => (
                                <tr key={user._id}>
                                  <td>
                                    <strong>{user.username}</strong>
                                  </td>
                                  <td>{user.email}</td>
                                  <td>
                                    <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                      {user.role === 'admin' ? '🛠️ Admin' : '👤 Joueur'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge bg-info">{user.scriptsCount}</span>
                                  </td>
                                  <td>
                                    <span className="badge bg-warning">{user.tournamentsCount}</span>
                                  </td>
                                  <td className="text-muted small">
                                    {formatDate(user.createdAt)}
                                  </td>
                                  <td>
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        className="btn btn-outline-info"
                                        onClick={() => handleViewUserScripts(user)}
                                        title="Voir les scripts"
                                      >
                                        📝
                                      </button>
                                      {user.role !== 'admin' && (
                                        <button
                                          className="btn btn-outline-danger"
                                          onClick={() => handleDeleteUser(user._id)}
                                          title="Supprimer l'utilisateur"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails utilisateur et scripts */}
                {selectedUser && (
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6>📝 Scripts de {selectedUser.username}</h6>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedUser(null);
                            setUserScripts([]);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="card-body">
                        {userScripts.length === 0 ? (
                          <div className="text-center text-muted py-3">
                            <p>Aucun script trouvé</p>
                          </div>
                        ) : (
                          <div className="list-group list-group-flush">
                            {userScripts.map(script => (
                              <div key={script._id} className="list-group-item d-flex justify-content-between align-items-center p-2">
                                <div>
                                  <strong>{script.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {formatDate(script.createdAt)}
                                  </small>
                                </div>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteScript(selectedUser._id, script._id)}
                                  title="Supprimer ce script"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Gestion des Inscriptions aux Tournois */}
          {activeTab === 'tournaments' && (
            <div className="tab-pane active">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>🏆 Gestion des Inscriptions ({tournaments.length} tournois)</h5>
                  <button className="btn btn-outline-primary btn-sm" onClick={loadTournaments}>
                    🔄 Actualiser
                  </button>
                </div>
                <div className="card-body">
                  {tournaments.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <h6>Aucun tournoi trouvé</h6>
                    </div>
                  ) : (
                    <div className="row">
                      {tournaments.map(tournament => (
                        <div key={tournament._id} className="col-md-6 mb-4">
                          <div className="card border-secondary">
                            <div className="card-header d-flex justify-content-between align-items-center">
                              <h6>{tournament.name}</h6>
                              <span className={`badge ${
                                tournament.status === 'registering' ? 'bg-info' :
                                tournament.status === 'running' ? 'bg-warning' : 'bg-success'
                              }`}>
                                {tournament.status === 'registering' ? '📋 Inscriptions' :
                                 tournament.status === 'running' ? '⚡ En cours' : '✅ Terminé'}
                              </span>
                            </div>
                            <div className="card-body">
                              <p className="text-muted mb-2">
                                <strong>Type:</strong> {tournament.type} | 
                                <strong> Participants:</strong> {tournament.participants.length}
                              </p>
                              
                              {tournament.participants.length > 0 ? (
                                <div className="participants-list">
                                  <strong>Participants:</strong>
                                  <div className="mt-2">
                                    {tournament.participants.map((participant) => (
                                      <div key={`${participant.user._id}-${participant.script._id}`} 
                                           className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                                        <div>
                                          <strong>{participant.user.username}</strong>
                                          <br />
                                          <small className="text-muted">
                                            📝 {participant.script.name}
                                          </small>
                                        </div>
                                        {tournament.status === 'registering' && (
                                          <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleRemoveFromTournament(tournament._id, participant.user._id)}
                                            title="Désinscrire ce joueur"
                                          >
                                            🗑️
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-muted py-3">
                                  <p>Aucun participant inscrit</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Manager de Tournois (réutilise le composant existant) */}
          {activeTab === 'manager' && (
            <div className="tab-pane active">
              <AdminTournamentManager />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 