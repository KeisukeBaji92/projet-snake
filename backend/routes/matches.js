const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// GET /api/matches/:id - Obtenir les détails d'un match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name')
      .populate('result.winner.user', 'username');

    if (!match) {
      return res.status(404).json({ message: 'Match non trouvé' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir le replay d'un match
router.get('/:id/replay', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match non trouvé' });
    }
    
    if (!match.replay || !match.replay.actions) {
      return res.status(404).json({ message: 'Replay non disponible' });
    }
    
    res.json(match.replay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 