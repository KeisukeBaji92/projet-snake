const express = require('express');
const router = express.Router();
const TournamentService = require('../services/TournamentService');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/tournaments - Obtenir tous les tournois actifs
router.get('/', async (req, res) => {
  try {
    const tournaments = await TournamentService.getActiveTournaments();
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

// POST /api/tournaments/:id/execute - Exécuter tous les matchs du tournoi (admin seulement)
router.post('/:id/execute', [auth, isAdmin], async (req, res) => {
  try {
    const result = await TournamentService.executeAllMatches(req.params.id);
    res.json(result);
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
    .populate('participants.script', 'name code')
    .sort({ created: -1 });
    
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tournaments/:id/matches - Obtenir tous les matchs d'un tournoi
router.get('/:id/matches', async (req, res) => {
  try {
    const Match = require('../models/Match');
    const matches = await Match.find({ tournament: req.params.id })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name')
      .sort({ created: 1 });
    
    res.json(matches);
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
      .populate('participants.script', 'name code');
    
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

module.exports = router; 