const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Générer un JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// Inscription
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({
        message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
      });
    }

    // Créer un nouvel utilisateur
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        created: user.created
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        created: user.created
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir le profil de l'utilisateur
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques détaillées de l'utilisateur
exports.getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const Tournament = require('../models/Tournament');
    const Match = require('../models/Match');
    const Script = require('../models/Script');

    // 1. Nombre de scripts
    const scriptsCount = await Script.countDocuments({ author: userId });
    console.log(`Scripts count for user ${userId}: ${scriptsCount}`);

    // 2. Statistiques des tournois
    const tournamentsParticipated = await Tournament.find({
      'participants.user': userId
    });

    const tournamentsWon = await Tournament.find({
      'winner.user': userId
    });
    
    console.log(`Tournaments for user ${userId}: participated=${tournamentsParticipated.length}, won=${tournamentsWon.length}`);

    // 3. Statistiques des matchs
    const matchesPlayed = await Match.find({
      'participants.user': userId,
      status: 'completed'
    }).populate('participants.user participants.script');

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalScore = 0;
    let maxScore = 0;
    let longestMatchDuration = 0;

    console.log(`Calculating stats for user ${userId}, found ${matchesPlayed.length} matches`);

    for (const match of matchesPlayed) {
      console.log(`Match result:`, match.result);
      
      // Trouver le participant utilisateur pour ce match
      const userParticipant = match.participants.find(p => {
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId;
      });
      
      if (!userParticipant) {
        continue; // Skip si l'utilisateur n'est pas trouvé
      }
      
      // Calculer victoires/défaites avec une logique améliorée
      if (match.result?.winner?.user) {
        // Cas 1: Il y a un gagnant explicite
        const winnerId = match.result.winner.user._id ? 
          match.result.winner.user._id.toString() : 
          match.result.winner.user.toString();
          
        if (winnerId === userId) {
          wins++;
        } else {
          losses++;
        }
      } else if (match.result?.finalScores) {
        // Cas 2: Pas de gagnant explicite, regarder les scores
        const userScore = userParticipant.color === 'red' ? 
          match.result.finalScores.red : 
          match.result.finalScores.blue;
        const opponentScore = userParticipant.color === 'red' ? 
          match.result.finalScores.blue : 
          match.result.finalScores.red;
          
        if (userScore > opponentScore) {
          wins++;
        } else if (userScore < opponentScore) {
          losses++;
        } else {
          draws++;
        }
      } else {
        // Cas 3: Aucune information disponible = match nul
        draws++;
      }

      // Calculer scores
      if (userParticipant && match.result?.finalScores) {
        const userScore = userParticipant.color === 'red' ? 
          match.result.finalScores.red : 
          match.result.finalScores.blue;
        
        totalScore += userScore || 0;
        if ((userScore || 0) > maxScore) {
          maxScore = userScore || 0;
        }
      }

      // Durée du match le plus long (en ms) avec calcul amélioré
      let matchDuration = 0;
      
      if (match.result?.duration && match.result.duration > 0) {
        matchDuration = match.result.duration;
      } else if (match.result?.rounds && match.result.rounds > 0) {
        // Calculer depuis le nombre de rounds (chaque round = ~200ms)
        matchDuration = match.result.rounds * 200;
      } else if (match.replay?.actions?.length > 0) {
        // Calculer depuis les actions du replay
        matchDuration = match.replay.actions.length * 100; // 100ms par action
      }
      
      if (matchDuration > longestMatchDuration) {
        longestMatchDuration = matchDuration;
      }
    }

    console.log(`Stats calculated: wins=${wins}, losses=${losses}, draws=${draws}, maxScore=${maxScore}, longestMatch=${longestMatchDuration}`);

    // 4. Calcul du ratio victoire/défaite
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

    // 5. Classement global (basé sur le ratio de victoires et nombre de tournois gagnés)
    const allUsers = await User.find({}).select('_id');
    let userRank = 1;
    
    for (const otherUser of allUsers) {
      if (otherUser._id.toString() === userId) continue;
      
      const otherWonTournaments = await Tournament.countDocuments({
        'winner.user': otherUser._id
      });
      
      const otherMatches = await Match.find({
        'participants.user': otherUser._id,
        status: 'completed'
      });
      
      let otherWins = 0;
      let otherTotal = 0;
      
      for (const match of otherMatches) {
        otherTotal++;
        if (match.result?.winner?.user?.toString() === otherUser._id.toString()) {
          otherWins++;
        }
      }
      
      const otherWinRate = otherTotal > 0 ? (otherWins / otherTotal) * 100 : 0;
      
      // Comparaison : d'abord tournois gagnés, puis ratio de victoires
      if (otherWonTournaments > tournamentsWon.length || 
          (otherWonTournaments === tournamentsWon.length && otherWinRate > parseFloat(winRate))) {
        userRank++;
      }
    }

    const stats = {
      tournaments: {
        played: tournamentsParticipated.length,
        won: tournamentsWon.length
      },
      matches: {
        played: totalGames,
        wins: wins,
        losses: losses,
        draws: draws,
        winRate: parseFloat(winRate)
      },
      scripts: {
        count: scriptsCount
      },
      records: {
        maxScore: maxScore, // Record de pommes mangées
        longestMatch: longestMatchDuration // Plus long combat en ms
      },
      ranking: {
        globalRank: userRank
      }
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 