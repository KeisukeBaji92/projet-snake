const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Script = require('../models/Script');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

// @route   GET /api/admin/users
// @desc    Obtenir la liste de tous les utilisateurs (admin seulement)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ created: -1 });

    // Enrichir avec les statistiques
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const scriptsCount = await Script.countDocuments({ author: user._id });
      const tournamentsCount = await Tournament.countDocuments({ 
        'participants.user': user._id 
      });
      
      return {
        ...user.toObject(),
        scriptsCount,
        tournamentsCount,
        totalMatches: user.stats.wins + user.stats.losses + user.stats.draws
      };
    }));

    res.json({
      users: usersWithStats,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur (admin seulement)
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de son propre compte
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer tous les scripts de l'utilisateur
    await Script.deleteMany({ author: userId });

    // Supprimer les références dans les tournois (optionnel - on peut garder l'historique)
    // await Tournament.updateMany(
    //   { 'participants.user': userId },
    //   { $pull: { participants: { user: userId } } }
    // );

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: `Utilisateur ${user.username} supprimé avec succès`,
      deletedUser: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Modifier le rôle d'un utilisateur (admin seulement)
router.put('/users/:id/role', auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    // Vérifier que le rôle est valide
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Doit être "user" ou "admin"' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de modifier son propre rôle
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    // Mettre à jour le rôle
    user.role = role;
    await user.save();

    res.json({ 
      message: `Rôle de ${user.username} modifié en ${role}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la modification du rôle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/stats
// @desc    Obtenir les statistiques globales (admin seulement)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalScripts = await Script.countDocuments();
    const totalTournaments = await Tournament.countDocuments();
    const totalMatches = await Match.countDocuments();

    // Utilisateurs récents (dernière semaine)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ 
      created: { $gte: oneWeekAgo } 
    });

    // Tournois actifs
    const activeTournaments = await Tournament.countDocuments({ 
      status: { $in: ['registering', 'running'] } 
    });

    res.json({
      totalUsers,
      totalAdmins,
      totalScripts,
      totalTournaments,
      totalMatches,
      recentUsers,
      activeTournaments,
      averageScriptsPerUser: totalUsers > 0 ? (totalScripts / totalUsers).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 