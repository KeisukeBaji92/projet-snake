const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  phase: {
    type: String,
    required: true // 'Phase de poules', 'Demi-finale', etc.
  },
  round: {
    type: Number,
    default: 1
  },
  
  // Participants du match
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    script: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Script',
      required: true
    },
    color: {
      type: String,
      enum: ['red', 'blue'],
      required: true
    }
  }],

  // Résultats
  result: {
    winner: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      script: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Script'
      },
      color: String
    },
    loser: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      script: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Script'
      },
      color: String
    },
    type: {
      type: String,
      enum: ['win', 'draw', 'timeout', 'error'],
      default: 'win'
    },
    reason: String, // 'collision', 'timeout', 'script_error', etc.
    duration: Number, // Durée en millisecondes
    rounds: Number, // Nombre de rounds joués
    finalScores: {
      red: Number,
      blue: Number
    }
  },

  // Configuration du match
  settings: {
    difficulty: {
      type: String,
      enum: ['normal', 'hard'],
      default: 'normal'
    },
    gridSize: {
      rows: { type: Number, default: 20 },
      cols: { type: Number, default: 20 }
    },
    maxRounds: {
      type: Number,
      default: 1000
    },
    timeoutMs: {
      type: Number,
      default: 10000
    }
  },

  // Données de replay - TOUTES les actions pour pouvoir rejouer le match
  replay: {
    seed: Number, // Seed pour la génération aléatoire (positions bombes, nourriture)
    initialState: {
      snake1: [{ x: Number, y: Number }],
      snake2: [{ x: Number, y: Number }],
      food: { x: Number, y: Number },
      bombs: [{ x: Number, y: Number }] // Pour le mode difficile
    },
    actions: [{
      round: Number,
      snake1Move: String, // 'up', 'down', 'left', 'right'
      snake2Move: String,
      events: [{
        type: { type: String }, // 'food_eaten', 'collision', 'new_food', 'bomb_hit'
        snake: { type: String }, // 'snake1' ou 'snake2'
        position: { x: { type: Number }, y: { type: Number } },
        details: mongoose.Schema.Types.Mixed // Infos supplémentaires
      }],
      state: {
        snake1: [{ x: Number, y: Number }],
        snake2: [{ x: Number, y: Number }],
        food: { x: Number, y: Number },
        scores: { s1: Number, s2: Number }
      }
    }]
  },

  // Métadonnées
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'error'],
    default: 'pending'
  },
  created: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  
  // Logs et debugging
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error']
    },
    message: String,
    details: mongoose.Schema.Types.Mixed
  }]
});

// Index pour les requêtes fréquentes
matchSchema.index({ tournament: 1, phase: 1 });
matchSchema.index({ 'participants.user': 1 });
matchSchema.index({ status: 1 });

// Méthodes utiles
matchSchema.methods.getParticipantByColor = function(color) {
  return this.participants.find(p => p.color === color);
};

matchSchema.methods.addLog = function(level, message, details = null) {
  this.logs.push({
    level,
    message,
    details,
    timestamp: new Date()
  });
};

matchSchema.methods.getReplayData = function() {
  return {
    matchId: this._id,
    participants: this.participants,
    settings: this.settings,
    replay: this.replay,
    result: this.result
  };
};

module.exports = mongoose.model('Match', matchSchema); 