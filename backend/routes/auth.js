const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Inscription d'un utilisateur
router.post('/register', [
  check('username', 'Le nom d\'utilisateur est requis').not().isEmpty(),
  check('email', 'Veuillez inclure un email valide').isEmail(),
  check('password', 'Veuillez entrer un mot de passe avec 6 caractères ou plus').isLength({ min: 6 })
], authController.register);

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
router.post('/login', [
  check('email', 'Veuillez inclure un email valide').isEmail(),
  check('password', 'Le mot de passe est requis').exists()
], authController.login);

// @route   GET /api/auth/profile
// @desc    Obtenir le profil de l'utilisateur
router.get('/profile', auth, authController.getProfile);

module.exports = router; 