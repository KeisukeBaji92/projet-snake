const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Script = require('../models/Script');

// Récupérer tous les scripts de l'utilisateur connecté
router.get('/', auth, async (req, res) => {
  try {
    const scripts = await Script.find({ author: req.user.id })
      .sort({ lastModified: -1 });
    res.json(scripts);
  } catch (err) {
    console.error('Erreur lors de la récupération des scripts:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouveau script
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, code, tags } = req.body;
    
    const script = new Script({
      name,
      description,
      code,
      tags,
      author: req.user.id
    });

    const savedScript = await script.save();
    res.status(201).json(savedScript);
  } catch (err) {
    console.error('Erreur lors de la création du script:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Données invalides' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un script
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, code, tags } = req.body;
    
    // Vérifier que le script appartient à l'utilisateur
    const script = await Script.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    script.name = name;
    script.description = description;
    script.code = code;
    script.tags = tags;
    script.lastModified = new Date();

    const updatedScript = await script.save();
    res.json(updatedScript);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du script:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Données invalides' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un script
router.delete('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id
    });

    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    res.json({ message: 'Script supprimé' });
  } catch (err) {
    console.error('Erreur lors de la suppression du script:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour les statistiques d'un script
router.patch('/:id/stats', auth, async (req, res) => {
  try {
    const { result } = req.body; // 'win', 'loss', ou 'draw'
    
    const script = await Script.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    if (result === 'win') script.stats.wins += 1;
    else if (result === 'loss') script.stats.losses += 1;
    else if (result === 'draw') script.stats.draws += 1;

    await script.save();
    res.json(script);
  } catch (err) {
    console.error('Erreur lors de la mise à jour des stats:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 