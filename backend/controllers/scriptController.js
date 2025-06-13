const User = require('../models/User');
const Script = require('../models/Script');
const Match = require('../models/Match');

// Obtenir tous les scripts d'un utilisateur avec leurs statistiques
exports.getUserScripts = async (req, res) => {
  try {
    console.log('🔍 Recherche des scripts pour l\'utilisateur ID:', req.user.id);
    
    // Récupérer les scripts de base
    const scripts = await Script.find({ author: req.user.id }).sort({ created: -1 });
    console.log('📝 Scripts trouvés:', scripts.length);
    
    // Calculer les statistiques pour chaque script
    const scriptsWithStats = await Promise.all(scripts.map(async (script) => {
      const stats = await calculateScriptStats(script._id);
      return {
        ...script.toObject(),
        stats
      };
    }));
    
    res.json(scriptsWithStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des scripts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour calculer les statistiques d'un script
async function calculateScriptStats(scriptId) {
  try {
    // Trouver tous les matchs où ce script a participé
    const matches = await Match.find({
      'participants.script': scriptId,
      status: 'completed'
    }).populate('participants.user participants.script');

    let wins = 0;
    let losses = 0; 
    let draws = 0;
    let totalScore = 0;
    let maxScore = 0;
    let totalMatches = matches.length;

    for (const match of matches) {
      // Trouver le participant avec ce script
      const scriptParticipant = match.participants.find(p => 
        p.script._id.toString() === scriptId.toString()
      );

      if (!scriptParticipant) continue;

      // Calculer le score de ce script dans ce match
      const scriptScore = scriptParticipant.color === 'red' ? 
        match.result?.finalScores?.red : 
        match.result?.finalScores?.blue;

      if (scriptScore !== undefined) {
        totalScore += scriptScore;
        if (scriptScore > maxScore) {
          maxScore = scriptScore;
        }
      }

      // Déterminer victoire/défaite/nul
      if (match.result?.winner?.script) {
        const winnerId = match.result.winner.script._id ? 
          match.result.winner.script._id.toString() : 
          match.result.winner.script.toString();
          
        if (winnerId === scriptId.toString()) {
          wins++;
        } else {
          losses++;
        }
      } else if (match.result?.finalScores) {
        // Cas où pas de gagnant explicite, regarder les scores
        const opponentParticipant = match.participants.find(p => 
          p.script._id.toString() !== scriptId.toString()
        );
        
        if (opponentParticipant) {
          const opponentScore = opponentParticipant.color === 'red' ? 
            match.result.finalScores.red : 
            match.result.finalScores.blue;
            
          if (scriptScore > opponentScore) {
            wins++;
          } else if (scriptScore < opponentScore) {
            losses++;
          } else {
            draws++;
          }
        } else {
          draws++;
        }
      } else {
        draws++;
      }
    }

    // Calculer le taux de victoire
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;

    return {
      totalMatches,
      wins,
      losses,
      draws,
      winRate: parseFloat(winRate),
      maxScore,
      averageScore: totalMatches > 0 ? (totalScore / totalMatches).toFixed(1) : 0
    };

  } catch (error) {
    console.error(`Erreur lors du calcul des stats pour le script ${scriptId}:`, error);
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      maxScore: 0,
      averageScore: 0
    };
  }
}

// Créer un nouveau script
exports.createScript = async (req, res) => {
  try {
    const { name, code, description, tags } = req.body;
    
    const newScript = new Script({
      name,
      code,
      description,
      tags,
      author: req.user.id
    });

    await newScript.save();
    
    // Populer l'auteur pour la réponse
    await newScript.populate('author', 'username email');
    
    res.status(201).json(newScript);
  } catch (error) {
    console.error('Erreur lors de la création du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un script
exports.updateScript = async (req, res) => {
  try {
    const { name, code, description, tags } = req.body;
    
    const script = await Script.findOne({ 
      _id: req.params.scriptId, 
      author: req.user.id 
    });
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    script.name = name;
    script.code = code;
    script.description = description;
    script.tags = tags;
    
    await script.save();
    await script.populate('author', 'username email');

    res.json(script);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir un script par ID (pour les tournois)
exports.getScriptById = async (req, res) => {
  try {
    const script = await Script.findById(req.params.scriptId).populate('author', 'username');
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    res.json(script);
  } catch (error) {
    console.error('Erreur lors de la récupération du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un script
exports.deleteScript = async (req, res) => {
  try {
    const script = await Script.findOne({ 
      _id: req.params.scriptId, 
      author: req.user.id 
    });
    
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }

    await Script.deleteOne({ _id: req.params.scriptId });

    res.json({ message: 'Script supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du script:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 