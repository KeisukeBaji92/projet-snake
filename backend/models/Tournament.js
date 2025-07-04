const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['waiting', 'registering', 'running', 'completed'],
    default: 'registering'
  },
  type: {
    type: String,
    enum: ['round_robin'],
    default: 'round_robin'
  },
  maxParticipants: {
    type: Number,
    default: 8
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
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    difficulty: {
      type: String,
      enum: ['normal', 'hard'],
      default: 'normal'
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
  stats: {
    totalMatches: {
      type: Number,
      default: 0
    },
    totalRounds: {
      type: Number,
      default: 0
    },
    averageMatchDuration: {
      type: Number,
      default: 0
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date
});

// Méthodes utiles
tournamentSchema.methods.canRegister = function() {
  return this.status === 'registering' && 
         this.participants.length < this.maxParticipants;
};

tournamentSchema.methods.canStart = function() {
  return this.status === 'registering' && 
         this.participants.length >= 2; // Minimum 2 participants
};

tournamentSchema.methods.isUserRegistered = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

module.exports = mongoose.model('Tournament', tournamentSchema); 