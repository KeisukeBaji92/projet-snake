const express = require('express');
const router = express.Router();
const TournamentService = require('../services/TournamentService');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const User = require('../models/User');
const Script = require('../models/Script');

// GET /api/tournaments - Obtenir tous les tournois
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .populate('participants.user', 'username')
      .populate('participants.script', 'name')
      .sort({ created: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tournaments - Créer un nouveau tournoi (admin seulement)
router.post('/', [auth, isAdmin], async (req, res) => {
  try {
    const tournament = await TournamentService.createTournament(req.body);
    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tournaments/:id - Modifier un tournoi (admin seulement)
router.put('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const tournament = await TournamentService.updateTournament(req.params.id, req.body);
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tournaments/:id - Supprimer un tournoi (admin seulement)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    await TournamentService.deleteTournament(req.params.id);
    res.json({ message: 'Tournoi supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tournaments/:id/start - Démarrer un tournoi (admin seulement)
router.post('/:id/start', [auth, isAdmin], async (req, res) => {
  try {
    const tournament = await TournamentService.startTournament(req.params.id);
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tournaments/:id/register - S'inscrire à un tournoi
router.post('/:id/register', auth, async (req, res) => {
  try {
    const tournament = await TournamentService.registerParticipant(
      req.params.id,
      req.user.id,
      req.body.scriptId
    );
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tournaments/:id - Obtenir les détails d'un tournoi
router.get('/:id', async (req, res) => {
  try {
    const tournament = await TournamentService.getTournamentById(req.params.id);
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tournaments/user/:userId - Obtenir les tournois d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const Tournament = require('../models/Tournament');
    const tournaments = await Tournament.find({
      'participants.user': req.params.userId
    })
    .populate('participants.user', 'username')
    .populate('participants.script', 'name')
    .sort({ created: -1 });
    
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tournaments/:id/leaderboard - Obtenir le classement d'un tournoi
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const Tournament = require('../models/Tournament');
    const Match = require('../models/Match');
    
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournoi non trouvé' });
    }

    // Calculer les statistiques pour chaque participant
    const leaderboard = [];
    
    for (const participant of tournament.participants) {
      const matches = await Match.find({
        tournament: req.params.id,
        'participants.user': participant.user._id,
        status: 'completed'
      });

      let wins = 0, losses = 0, draws = 0, totalScore = 0;
      
      for (const match of matches) {
        if (match.result.winner && match.result.winner.user.toString() === participant.user._id.toString()) {
          wins++;
        } else if (match.result.loser && match.result.loser.user.toString() === participant.user._id.toString()) {
          losses++;
        } else {
          draws++;
        }
        
        // Calculer le score total
        const userParticipant = match.participants.find(p => p.user.toString() === participant.user._id.toString());
        if (userParticipant) {
          const score = userParticipant.color === 'red' ? 
            match.result.finalScores.red : 
            match.result.finalScores.blue;
          totalScore += score || 0;
        }
      }

      leaderboard.push({
        user: participant.user,
        script: participant.script,
        stats: { wins, losses, draws },
        totalScore,
        matchesPlayed: matches.length,
        points: wins * 3 + draws * 1 // Système de points : 3 pour victoire, 1 pour nul
      });
    }

    // Trier par points puis par score total
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.totalScore - a.totalScore;
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un tournoi
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, maxParticipants = 8 } = req.body;
    
    const tournament = new Tournament({
      name,
      description,
      maxParticipants,
      tournamentType: 'elimination', // Toujours élimination directe
      creator: req.user.id,
      status: 'registering',
      participants: []
    });

    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// S'inscrire à un tournoi
router.post('/:id/register', auth, async (req, res) => {
  try {
    const { scriptId } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }
    
    if (tournament.status !== 'registering') {
      return res.status(400).json({ message: 'Les inscriptions sont fermées' });
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ message: 'Tournoi complet' });
    }
    
    // Vérifier si l'utilisateur est déjà inscrit
    const alreadyRegistered = tournament.participants.some(
      p => p.user.toString() === req.user.id
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Déjà inscrit à ce tournoi' });
    }
    
    // Vérifier que le script appartient à l'utilisateur
    const script = await Script.findOne({ _id: scriptId, author: req.user.id });
    if (!script) {
      return res.status(404).json({ message: 'Script non trouvé' });
    }
    
    tournament.participants.push({
      user: req.user.id,
      script: scriptId
    });
    
    await tournament.save();
    
    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');
    
    res.json(updatedTournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Démarrer un tournoi
router.post('/:id/start', auth, async (req, res) => {
  try {
    console.log('🚀 Début démarrage tournoi:', req.params.id);
    
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username')
      .populate('participants.script');
    
    console.log('📋 Tournoi trouvé:', tournament?.name, 'avec', tournament?.participants?.length, 'participants');
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }
    
    if (tournament.participants.length < 2) {
      return res.status(400).json({ message: 'Il faut au moins 2 participants' });
    }
    
    // Passer le statut à "running"
    console.log('📝 Changement statut en running...');
    tournament.status = 'running';
    await tournament.save();
    
    // Générer le bracket d'élimination directe
    console.log('🏗️ Génération du bracket...');
    const matches = await generateEliminationBracket(tournament);
    console.log('✅ Bracket généré:', matches.length, 'matchs');
    
    // Exécuter tous les matchs
    console.log('🎮 Exécution des matchs...');
    await executeAllMatches(matches);
    console.log('✅ Matchs terminés');
    
    // Déterminer le gagnant
    const finalMatch = matches.find(m => m.phase === 'finale');
    if (finalMatch && finalMatch.result) {
      tournament.winner = finalMatch.result.winner;
      tournament.status = 'completed';
      await tournament.save();
      console.log('🏆 Gagnant:', finalMatch.result.winner);
    }
    
    console.log('🎉 Tournoi terminé avec succès');
    res.json({ message: 'Tournoi exécuté avec succès', tournament });
  } catch (error) {
    console.error('❌ ERREUR TOURNOI:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les matchs d'un tournoi
router.get('/:id/matches', async (req, res) => {
  try {
    const matches = await Match.find({ tournament: req.params.id })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name')
      .sort({ createdAt: 1 });
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fonctions helper  
async function generateEliminationBracket(tournament) {
  const participants = [...tournament.participants];
  const matches = [];
  
  // Créer tous les matchs du premier tour
  for (let i = 0; i < participants.length; i += 2) {
    if (i + 1 < participants.length) {
      const participant1 = participants[i];
      const participant2 = participants[i + 1];
      
      const match = new Match({
        tournament: tournament._id,
        participants: [
          { 
            user: participant1.user._id || participant1.user, 
            script: participant1.script._id || participant1.script, 
            color: 'red' 
          },
          { 
            user: participant2.user._id || participant2.user, 
            script: participant2.script._id || participant2.script, 
            color: 'blue' 
          }
        ],
        phase: getPhaseLabel(participants.length),
        status: 'pending'
      });
      
      await match.save();
      matches.push(match);
    }
  }
  
  return matches;
}

function getPhaseLabel(participantsCount) {
  if (participantsCount === 2) return 'finale';
  if (participantsCount === 4) return 'demi-finale';
  if (participantsCount === 8) return 'quart-de-finale';
  return 'premier-tour';
}

async function executeAllMatches(matches) {
  const GameEngine = require('../services/GameEngine');
  
  // Trier les matchs par phase (premiers tours d'abord)
  const sortedMatches = matches.sort((a, b) => {
    const phaseOrder = { 'tour-1': 1, 'quart-de-finale': 2, 'demi-finale': 3, 'finale': 4 };
    return (phaseOrder[a.phase] || 0) - (phaseOrder[b.phase] || 0);
  });
  
  for (const match of sortedMatches) {
    try {
      console.log(`Exécution du match: ${match.phase}`);
      
      // Simuler le match
      const result = await GameEngine.simulateMatch(
        match.participants[0].script,
        match.participants[1].script
      );
      
      // Sauvegarder le résultat
      const winnerIndex = result.winner === 'script1' ? 0 : 1;
      match.result = {
        winner: result.winner === 'draw' ? null : {
          user: match.participants[winnerIndex].user,
          script: match.participants[winnerIndex].script
        },
        loser: result.winner === 'draw' ? null : {
          user: match.participants[1 - winnerIndex].user,
          script: match.participants[1 - winnerIndex].script
        },
        finalScores: result.finalScores,
        moves: result.moves,
        duration: result.duration
      };
      
      match.replay = {
        actions: result.replay || [],
        finalState: result.finalState
      };
      
      match.status = 'completed';
      await match.save();
      
      console.log(`Match terminé: ${match.phase}`);
    } catch (error) {
      console.error(`Erreur match ${match.phase}:`, error);
      match.status = 'error';
      await match.save();
    }
  }
}

module.exports = router; 