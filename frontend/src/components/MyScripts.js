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
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                  selectedScript?._id === script._id ? 'active' : ''
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <div>
                  <h5 className="mb-1">{script.name}</h5>
                  <small>Modifié le {new Date(script.lastModified).toLocaleDateString()}</small>
                </div>
                <div>
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

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <small className="text-muted">
                      Créé le {new Date(selectedScript.created).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="stats">
                    <span className="badge bg-success me-1">
                      {selectedScript.stats?.wins || 0} victoires
                    </span>
                    <span className="badge bg-danger me-1">
                      {selectedScript.stats?.losses || 0} défaites
                    </span>
                    <span className="badge bg-secondary">
                      {selectedScript.stats?.draws || 0} nuls
                    </span>
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