const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
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
  phase: {
    type: String,
    required: true // 'tour-1', 'quart-de-finale', 'demi-finale', 'finale'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'error'],
    default: 'pending'
  },
  result: {
    winner: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      script: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Script'
      }
    },
    finalScores: {
      red: { type: Number, default: 0 },
      blue: { type: Number, default: 0 }
    },
    moves: { type: Number, default: 0 },
    duration: { type: Number, default: 0 } // en millisecondes
  },
  replay: {
    actions: [{
      turn: Number,
      snake1Move: String,
      snake2Move: String,
      snake1: [{ x: Number, y: Number }],
      snake2: [{ x: Number, y: Number }],
      food: { x: Number, y: Number },
      score1: Number,
      score2: Number
    }],
    finalState: {
      snake1: [{ x: Number, y: Number }],
      snake2: [{ x: Number, y: Number }],
      food: { x: Number, y: Number }
    }
  }
}, {
  timestamps: true
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