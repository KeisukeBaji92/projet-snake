import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scriptService } from '../services/scriptService';
import { defaultScript } from './defaultScripts';
import './MyScripts.css';

const MyScripts = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    code: defaultScript,
    tags: ''
  });

  // Charger les scripts au montage du composant
  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const data = await scriptService.getUserScripts();
      setScripts(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des scripts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedScript(null);
    setEditMode(true);
    setNewScript({
      name: '',
      description: '',
      code: defaultScript,
      tags: ''
    });
  };

  const handleSave = async () => {
    if (!newScript.name.trim()) {
      alert('Le nom du script est obligatoire !');
      return;
    }

    try {
      const scriptData = {
        ...newScript,
        tags: newScript.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        author: user._id
      };

      let savedScript;
      if (selectedScript) {
        savedScript = await scriptService.updateScript(selectedScript._id, scriptData);
      } else {
        savedScript = await scriptService.createScript(scriptData);
      }

      setScripts(prevScripts => {
        if (selectedScript) {
          return prevScripts.map(s => s._id === savedScript._id ? savedScript : s);
        }
        return [...prevScripts, savedScript];
      });

      setEditMode(false);
      setSelectedScript(savedScript);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du script');
      console.error(err);
    }
  };

  const handleDelete = async (scriptId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce script ?')) {
      try {
        await scriptService.deleteScript(scriptId);
        setScripts(prevScripts => prevScripts.filter(s => s._id !== scriptId));
        if (selectedScript?._id === scriptId) {
          setSelectedScript(null);
          setEditMode(false);
        }
        setError(null);
      } catch (err) {
        setError('Erreur lors de la suppression du script');
        console.error(err);
      }
    }
  };

  const handleEdit = (script) => {
    setSelectedScript(script);
    setNewScript({
      name: script.name,
      description: script.description,
      code: script.code,
      tags: script.tags.join(', ')
    });
    setEditMode(true);
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

  return (
    <div className="container my-4">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="row">
        {/* Liste des scripts */}
        <div className="col-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Mes Scripts</h2>
            <button className="btn btn-primary" onClick={handleCreateNew}>
              Nouveau Script
            </button>
          </div>
          
          <div className="list-group">
            {scripts.map(script => (
              <div
                key={script._id}
                className={`list-group-item list-group-item-action ${
                  selectedScript?._id === script._id ? 'active' : ''
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h5 className="mb-0">{script.name}</h5>
                      <div className="script-actions">
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(script);
                          }}
                        >
                          Éditer
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(script._id);
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                    
                    {/* Statistiques de performance */}
                    {script.stats && script.stats.totalMatches > 0 ? (
                      <div className="script-stats mb-2">
                        <div className="row text-center">
                          <div className="col">
                            <small className="text-muted d-block">Matchs</small>
                            <span className="badge bg-secondary">{script.stats.totalMatches}</span>
                          </div>
                          <div className="col">
                            <small className="text-muted d-block">Winrate</small>
                            <span className={`badge ${
                              script.stats.winRate >= 70 ? 'bg-success' :
                              script.stats.winRate >= 50 ? 'bg-warning text-dark' :
                              'bg-danger'
                            }`}>
                              {script.stats.winRate}%
                            </span>
                          </div>
                          <div className="col">
                            <small className="text-muted d-block">Record</small>
                            <span className="badge bg-info">{script.stats.maxScore} 🍎</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <small className="text-muted">
                            🏆 {script.stats.wins} · 🔴 {script.stats.losses} · ⚪ {script.stats.draws}
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="script-stats mb-2">
                        <small className="text-muted">📊 Aucun match joué</small>
                      </div>
                    )}
                    
                    <small className="text-muted">
                      Modifié le {new Date(script.lastModified).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
            {scripts.length === 0 && (
              <div className="text-center p-3 text-muted">
                Aucun script sauvegardé
              </div>
            )}
          </div>
        </div>

        {/* Détails du script */}
        <div className="col-md-8">
          {editMode ? (
            <div className="card">
              <div className="card-body">
                <h3>{selectedScript ? 'Modifier le script' : 'Nouveau script'}</h3>
                <div className="mb-3">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newScript.name}
                    onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={newScript.description}
                    onChange={(e) => setNewScript({...newScript, description: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newScript.tags}
                    onChange={(e) => setNewScript({...newScript, tags: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <textarea
                    className="form-control font-monospace"
                    rows="15"
                    value={newScript.code}
                    onChange={(e) => setNewScript({...newScript, code: e.target.value})}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditMode(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          ) : selectedScript ? (
            <div className="card">
              <div className="card-body">
                <h3>{selectedScript.name}</h3>
                <p className="text-muted">{selectedScript.description}</p>
                
                <div className="mb-3">
                  {selectedScript.tags.map(tag => (
                    <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                  ))}
                </div>

                {/* Statistiques détaillées */}
                {selectedScript.stats && selectedScript.stats.totalMatches > 0 ? (
                  <div className="card mb-3 bg-light">
                    <div className="card-body">
                      <h5 className="card-title">📊 Statistiques de Performance</h5>
                      <div className="row text-center">
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className="stat-value">{selectedScript.stats.totalMatches}</div>
                            <div className="stat-label">Matchs joués</div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className={`stat-value text-${
                              selectedScript.stats.winRate >= 70 ? 'success' :
                              selectedScript.stats.winRate >= 50 ? 'warning' :
                              'danger'
                            }`}>
                              {selectedScript.stats.winRate}%
                            </div>
                            <div className="stat-label">Taux de victoire</div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className="stat-value text-success">{selectedScript.stats.wins}</div>
                            <div className="stat-label">Victoires</div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className="stat-value text-danger">{selectedScript.stats.losses}</div>
                            <div className="stat-label">Défaites</div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className="stat-value text-info">{selectedScript.stats.maxScore}</div>
                            <div className="stat-label">Record 🍎</div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="stat-item">
                            <div className="stat-value text-primary">{selectedScript.stats.averageScore}</div>
                            <div className="stat-label">Score moyen</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Ce script n'a pas encore participé à des matchs. Utilisez-le dans un tournoi ou le bac à sable pour voir ses performances !
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <small className="text-muted">
                      Créé le {new Date(selectedScript.created).toLocaleDateString()}
                    </small>
                  </div>
                </div>

                <pre className="bg-light p-3 rounded">
                  <code>{selectedScript.code}</code>
                </pre>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(selectedScript)}
                  >
                    Éditer
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(selectedScript._id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-5 text-muted">
              Sélectionnez un script ou créez-en un nouveau
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyScripts; 