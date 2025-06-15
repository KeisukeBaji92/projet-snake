const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Routes publiques (pas besoin d'authentification pour voir le leaderboard)
router.get('/', leaderboardController.getLeaderboard);
router.get('/stats', leaderboardController.getGlobalStats);

module.exports = router; 