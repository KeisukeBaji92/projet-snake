const API_URL = 'http://localhost:5000/api';

export const scriptService = {
  // Récupérer tous les scripts de l'utilisateur
  getUserScripts: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/scripts/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des scripts');
    return response.json();
  },

  // Créer un nouveau script
  createScript: async (scriptData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/scripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scriptData)
    });
    if (!response.ok) throw new Error('Erreur lors de la création du script');
    return response.json();
  },

  // Mettre à jour un script
  updateScript: async (scriptId, scriptData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/scripts/${scriptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scriptData)
    });
    if (!response.ok) throw new Error('Erreur lors de la mise à jour du script');
    return response.json();
  },

  // Supprimer un script
  deleteScript: async (scriptId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/scripts/${scriptId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression du script');
    return response.json();
  }
}; 