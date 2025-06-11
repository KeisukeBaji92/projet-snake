const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const auth = require('../middleware/auth');

// Obtenir tous les scripts de l'utilisateur connecté
router.get('/user', auth, scriptController.getUserScripts);

// Créer un nouveau script
router.post('/', auth, scriptController.createScript);

// Mettre à jour un script
router.put('/:scriptId', auth, scriptController.updateScript);

// Supprimer un script
router.delete('/:scriptId', auth, scriptController.deleteScript);

module.exports = router; 