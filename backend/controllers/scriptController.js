const User = require('../models/User');
const Script = require('../models/Script');

// Obtenir tous les scripts d'un utilisateur
exports.getUserScripts = async (req, res) => {
  try {
    console.log('🔍 Recherche des scripts pour l\'utilisateur ID:', req.user.id);
    const scripts = await Script.find({ author: req.user.id }).sort({ created: -1 });
    console.log('📝 Scripts trouvés:', scripts.length);
    if (scripts.length > 0) {
      console.log('Premier script:', { name: scripts[0].name, author: scripts[0].author });
    }
    res.json(scripts);
  } catch (error) {
    console.error('Erreur lors de la récupération des scripts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau script
exports.createScript = async (req, res) => {
  try {
    const { name, code, description, tags } = req.body;
    
    const newScript = new Script({
      name,
      code,
      description,
      tags,
      author: req.user.id
    });

    await newScript.save();
    
    // Populer l'auteur pour la réponse
    await newScript.populate('author', 'username email');
    
    res.status(201).json(newScript);
  } catch (error) {
    console.error('Erreur lors de la création du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un script
exports.updateScript = async (req, res) => {
  try {
    const { name, code, description, tags } = req.body;
    
    const script = await Script.findOne({ 
      _id: req.params.scriptId, 
      author: req.user.id 
    });
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    script.name = name;
    script.code = code;
    script.description = description;
    script.tags = tags;
    
    await script.save();
    await script.populate('author', 'username email');

    res.json(script);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir un script par ID (pour les tournois)
exports.getScriptById = async (req, res) => {
  try {
    const script = await Script.findById(req.params.scriptId).populate('author', 'username');
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    res.json(script);
  } catch (error) {
    console.error('Erreur lors de la récupération du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un script
exports.deleteScript = async (req, res) => {
  try {
    const script = await Script.findOne({ 
      _id: req.params.scriptId, 
      author: req.user.id 
    });
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    await Script.deleteOne({ _id: req.params.scriptId });

    res.json({ message: 'Script supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 