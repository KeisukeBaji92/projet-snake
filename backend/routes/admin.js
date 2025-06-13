const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const {
  getAllUsers,
  deleteUser,
  getUserScripts,
  deleteUserScript,
  removeUserFromTournament,
  getTournamentsWithParticipants
} = require('../controllers/adminController');

// Routes pour la gestion des utilisateurs (admin only)
router.get('/users', [auth, isAdmin], getAllUsers);
router.delete('/users/:userId', [auth, isAdmin], deleteUser);
router.get('/users/:userId/scripts', [auth, isAdmin], getUserScripts);
router.delete('/users/:userId/scripts/:scriptId', [auth, isAdmin], deleteUserScript);

// Routes pour la gestion des tournois (admin only)
router.get('/tournaments', [auth, isAdmin], getTournamentsWithParticipants);
router.delete('/tournaments/:tournamentId/participants/:userId', [auth, isAdmin], removeUserFromTournament);

module.exports = router; 