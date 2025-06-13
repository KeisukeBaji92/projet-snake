const User = require('../models/User');
const Script = require('../models/Script');
const Tournament = require('../models/Tournament');

// Récupérer tous les utilisateurs avec leurs statistiques
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .lean();

    // Calculer les statistiques pour chaque utilisateur
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const scriptsCount = await Script.countDocuments({ author: user._id });
      
      // Compter les inscriptions aux tournois
      const tournamentsCount = await Tournament.countDocuments({
        'participants.user': user._id
      });

      return {
        ...user,
        scriptsCount,
        tournamentsCount,
        createdAt: user.createdAt,
        lastActive: user.lastActive || user.createdAt
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur et tous ses scripts
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression d'un admin par un autre admin
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Impossible de supprimer un administrateur' });
    }

    // Supprimer tous les scripts de l'utilisateur
    await Script.deleteMany({ author: userId });

    // Retirer l'utilisateur de tous les tournois en cours d'inscription
    await Tournament.updateMany(
      { 
        status: 'registering',
        'participants.user': userId 
      },
      { 
        $pull: { participants: { user: userId } } 
      }
    );

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: 'Utilisateur supprimé avec succès',
      deletedUser: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les scripts d'un utilisateur
const getUserScripts = async (req, res) => {
  try {
    const { userId } = req.params;

    const scripts = await Script.find({ author: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(scripts);
  } catch (error) {
    console.error('Erreur lors de la récupération des scripts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un script spécifique d'un utilisateur
const deleteUserScript = async (req, res) => {
  try {
    const { userId, scriptId } = req.params;

    // Vérifier que le script appartient bien à l'utilisateur
    const script = await Script.findOne({ _id: scriptId, author: userId });
    if (!script) {
      return res.status(404).json({ error: 'Script non trouvé' });
    }

    // Retirer le script de tous les tournois en cours d'inscription
    await Tournament.updateMany(
      { 
        status: 'registering',
        'participants.script': scriptId 
      },
      { 
        $pull: { participants: { script: scriptId } } 
      }
    );

    // Supprimer le script
    await Script.findByIdAndDelete(scriptId);

    res.json({ 
      message: 'Script supprimé avec succès',
      deletedScript: {
        name: script.name,
        owner: script.author
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du script:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Désinscrire un utilisateur d'un tournoi (seulement si en phase d'inscription)
const removeUserFromTournament = async (req, res) => {
  try {
    const { tournamentId, userId } = req.params;

    // Vérifier que le tournoi existe et est en phase d'inscription
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournoi non trouvé' });
    }

    if (tournament.status !== 'registering') {
      return res.status(400).json({ 
        error: 'Impossible de désinscrire un joueur : le tournoi n\'est plus en phase d\'inscription' 
      });
    }

    // Vérifier que l'utilisateur est bien inscrit
    const participantIndex = tournament.participants.findIndex(
      p => p.user.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non inscrit à ce tournoi' });
    }

    // Retirer le participant
    tournament.participants.splice(participantIndex, 1);
    await tournament.save();

    // Récupérer les infos utilisateur pour la réponse
    const user = await User.findById(userId).select('username');

    res.json({ 
      message: 'Utilisateur désinscrit avec succès',
      tournament: tournament.name,
      removedUser: user.username,
      remainingParticipants: tournament.participants.length
    });
  } catch (error) {
    console.error('Erreur lors de la désinscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les tournois avec leurs participants détaillés
const getTournamentsWithParticipants = async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .populate('participants.user', 'username email')
      .populate('participants.script', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json(tournaments);
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getUserScripts,
  deleteUserScript,
  removeUserFromTournament,
  getTournamentsWithParticipants
}; 