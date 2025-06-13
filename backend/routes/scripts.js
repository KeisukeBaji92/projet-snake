const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const auth = require('../middleware/auth');

// Obtenir tous les scripts de l'utilisateur connecté
router.get('/user', auth, scriptController.getUserScripts);

// Route alternative pour compatibilité
router.get('/', auth, scriptController.getUserScripts);

// Route de débogage pour lister tous les scripts (à des fins de diagnostic)
router.get('/debug/all', auth, async (req, res) => {
  try {
    const Script = require('../models/Script');
    const scripts = await Script.find({}).populate('author', 'username email');
    res.json({
      totalScripts: scripts.length,
      currentUserId: req.user.id,
      scripts: scripts.map(s => ({
        name: s.name,
        authorId: s.author._id,
        authorName: s.author.username,
        isOwner: s.author._id.toString() === req.user.id
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un nouveau script
router.post('/', auth, scriptController.createScript);

// Mettre à jour un script
router.put('/:scriptId', auth, scriptController.updateScript);

// Supprimer un script
router.delete('/:scriptId', auth, scriptController.deleteScript);

module.exports = router; 