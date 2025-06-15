const User = require('../models/User');
const Script = require('../models/Script');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// Calculer le leaderboard avec système de points
const getLeaderboard = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs non-admin
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('username email createdAt stats')
      .lean();

    // Calculer les statistiques avancées pour chaque utilisateur
    const leaderboardData = await Promise.all(users.map(async (user) => {
      // Compter les scripts
      const scriptsCount = await Script.countDocuments({ author: user._id });
      
      // Statistiques des matchs (depuis les stats du user et les matchs)
      const userStats = user.stats || { wins: 0, losses: 0, draws: 0 };
      
      // Calculer les matchs récents depuis la collection Match
      const recentMatches = await Match.find({
        $or: [
          { 'participants.0.user': user._id },
          { 'participants.1.user': user._id }
        ],
        status: 'completed'
      }).limit(10).sort({ createdAt: -1 }).lean();
      
      // Compter les tournois auxquels l'utilisateur a participé
      const tournamentsCount = await Tournament.countDocuments({
        'participants.user': user._id
      });
      
      // Calculer les matchs totaux
      const totalMatches = userStats.wins + userStats.losses + userStats.draws;
      
      // Système de calcul des points
      const winPoints = userStats.wins * 3;      // 3 points par victoire
      const drawPoints = userStats.draws * 1;    // 1 point par match nul
      const lossPoints = userStats.losses * 0;   // 0 point par défaite
      
      // Bonus pour la créativité (scripts)
      const creativityBonus = Math.min(scriptsCount * 0.5, 5); // Max 5 points bonus
      
      // Bonus d'activité (tournois)
      const activityBonus = Math.min(tournamentsCount * 0.3, 3); // Max 3 points bonus
      
      // Score total
      const totalScore = winPoints + drawPoints + creativityBonus + activityBonus;
      
      // Ratio de victoire (pourcentage)
      const winRate = totalMatches > 0 ? (userStats.wins / totalMatches) * 100 : 0;
      
      // Calculer la forme récente (victoires sur les 5 derniers matchs)
      let recentForm = 0;
      recentMatches.slice(0, 5).forEach(match => {
        const isPlayer1 = match.participants[0].user.toString() === user._id.toString();
        const playerResult = isPlayer1 ? match.result?.player1 : match.result?.player2;
        
        if (playerResult === 'win') recentForm += 1;
        else if (playerResult === 'draw') recentForm += 0.5;
      });
      
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        stats: userStats,
        scriptsCount,
        tournamentsCount,
        totalMatches,
        totalScore: Math.round(totalScore * 10) / 10, // Arrondi à 1 décimale
        winRate: Math.round(winRate * 10) / 10,
        recentForm: Math.round(recentForm * 10) / 10,
        creativityBonus: Math.round(creativityBonus * 10) / 10,
        activityBonus: Math.round(activityBonus * 10) / 10,
        // Métadonnées pour le classement
        ancienneté: Date.now() - new Date(user.createdAt).getTime()
      };
    }));

    // Trier par score total (desc), puis par winRate (desc), puis par ancienneté (asc)
    leaderboardData.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return a.ancienneté - b.ancienneté; // Plus ancien = meilleur en cas d'égalité
    });

    // Ajouter les positions et badges
    const finalLeaderboard = leaderboardData.map((player, index) => {
      let badge = null;
      let badgeColor = null;
      
      // Attribution des badges selon la position
      if (index === 0) {
        badge = '👑 Champion';
        badgeColor = '#FFD700'; // Or
      } else if (index === 1) {
        badge = '🥈 Vice-Champion';
        badgeColor = '#C0C0C0'; // Argent
      } else if (index === 2) {
        badge = '🥉 3ème Place';
        badgeColor = '#CD7F32'; // Bronze
      } else if (index < 5) {
        badge = '⭐ Top 5';
        badgeColor = '#4A90E2'; // Bleu
      }
      
      // Badges spéciaux
      if (player.scriptsCount >= 5) {
        badge = badge ? `${badge} 🎨 Créatif` : '🎨 Créatif';
      }
      
      if (player.winRate >= 80 && player.totalMatches >= 5) {
        badge = badge ? `${badge} 🔥 Invincible` : '🔥 Invincible';
      }
      
      if (player.recentForm >= 4) {
        badge = badge ? `${badge} 📈 En Forme` : '📈 En Forme';
      }

      return {
        ...player,
        position: index + 1,
        badge,
        badgeColor,
        // Retirer les métadonnées internes
        ancienneté: undefined
      };
    });

    res.json({
      leaderboard: finalLeaderboard,
      totalPlayers: finalLeaderboard.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la génération du leaderboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les statistiques globales de la plateforme
const getGlobalStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalScripts = await Script.countDocuments();
    const totalMatches = await Match.countDocuments({ status: 'completed' });
    const totalTournaments = await Tournament.countDocuments();
    
    // Utilisateur le plus actif (le plus de scripts)
    const mostActiveUser = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $lookup: {
          from: 'scripts',
          localField: '_id',
          foreignField: 'author',
          as: 'scripts'
        }
      },
      { $addFields: { scriptsCount: { $size: '$scripts' } } },
      { $sort: { scriptsCount: -1 } },
      { $limit: 1 },
      { $project: { username: 1, scriptsCount: 1 } }
    ]);

    res.json({
      totalUsers,
      totalScripts,
      totalMatches,
      totalTournaments,
      mostActiveUser: mostActiveUser[0] || null,
      averageScriptsPerUser: totalUsers > 0 ? Math.round((totalScripts / totalUsers) * 10) / 10 : 0
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats globales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getLeaderboard,
  getGlobalStats
}; 