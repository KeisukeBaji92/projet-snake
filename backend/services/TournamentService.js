const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Script = require('../models/Script');
const User = require('../models/User');
const GameEngine = require('./GameEngine');

class TournamentService {
  
  // Créer un nouveau tournoi
  static async createTournament(data) {
    const tournament = new Tournament({
      name: data.name,
      description: data.description,
      maxParticipants: data.maxParticipants,
      type: data.type,
      settings: {
        difficulty: data.difficulty,
        maxRounds: data.maxRounds || 1000,
        timeoutMs: data.timeoutMs || 10000
      }
    });

    await tournament.save();
    return tournament;
  }

  // Inscrire un joueur au tournoi
  static async registerParticipant(tournamentId, userId, scriptId) {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    if (tournament.status !== 'registering') {
      throw new Error('Les inscriptions sont fermées');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Le tournoi est complet');
    }

    if (tournament.participants.some(p => p.user.toString() === userId)) {
      throw new Error('Vous êtes déjà inscrit à ce tournoi');
    }

    // Vérifier que le script appartient à l'utilisateur
    const script = await Script.findOne({ _id: scriptId, author: userId });
    if (!script) {
      throw new Error('Script non trouvé ou non autorisé');
    }

    tournament.participants.push({
      user: userId,
      script: scriptId,
      registeredAt: new Date()
    });

    await tournament.save();
    return tournament;
  }

  // Démarrer un tournoi (simplifié pour round robin uniquement)
  static async startTournament(id) {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    if (tournament.status !== 'registering') {
      throw new Error('Le tournoi ne peut pas être démarré');
    }

    if (tournament.participants.length < 2) {
      throw new Error('Il faut au moins 2 participants pour démarrer le tournoi');
    }

    // Simplement changer le status - les matchs seront créés par executeAllMatches
    tournament.status = 'running';
    tournament.startedAt = new Date();

    await tournament.save();
    return tournament;
  }

  // Note: Les phases sont maintenant gérées directement par executeAllMatches
  // Plus besoin de générer des phases séparées en round robin

  // Créer un match
  static async createMatch(tournamentId, phaseName, participant1, participant2, settings) {
    const match = new Match({
      tournament: tournamentId,
      phase: phaseName,
      participants: [
        {
          user: participant1.user,
          script: participant1.script,
          color: 'red'
        },
        {
          user: participant2.user,
          script: participant2.script,
          color: 'blue'
        }
      ],
      settings: {
        difficulty: settings.difficulty,
        gridSize: { rows: 20, cols: 20 },
        maxRounds: settings.maxRounds,
        timeoutMs: settings.timeoutMs
      },
      status: 'pending'
    });

    return await match.save();
  }

  // Exécuter un match
  static async executeMatch(matchId) {
    const match = await Match.findById(matchId)
      .populate('participants.script', 'code');

    if (!match) {
      throw new Error('Match non trouvé');
    }

    if (match.status !== 'pending') {
      throw new Error('Match déjà exécuté');
    }

    match.status = 'running';
    match.startedAt = new Date();
    await match.save();

    try {
      // Récupérer les scripts
      const script1 = match.participants.find(p => p.color === 'red').script.code;
      const script2 = match.participants.find(p => p.color === 'blue').script.code;

      // Créer le moteur de jeu
      const engine = new GameEngine(match.settings);

      // Simuler le match
      const { result, replay } = await engine.simulateMatch(script1, script2);

      // Corriger le format des événements dans le replay
      const fixedReplay = {
        ...replay,
        actions: replay.actions.map(action => ({
          ...action,
          events: Array.isArray(action.events) ? action.events : []
        }))
      };

      // Mettre à jour le match avec les résultats
      match.result = {
        ...result,
        winner: this.determineWinner(match, result.winner),
        loser: this.determineLoser(match, result.winner)
      };

      match.replay = fixedReplay;
      match.status = 'completed';
      match.completedAt = new Date();

      await match.save();

      // Mettre à jour les statistiques
      await this.updateStats(match);

      return match;

    } catch (error) {
      match.status = 'error';
      match.addLog('error', 'Erreur lors de l\'exécution du match', error.message);
      await match.save();
      throw error;
    }
  }

  // Déterminer le gagnant du match
  static determineWinner(match, gameWinner) {
    if (gameWinner === 'draw') return null;
    
    const winnerColor = gameWinner === 'snake1' ? 'red' : 'blue';
    const winner = match.participants.find(p => p.color === winnerColor);
    
    return {
      user: winner.user,
      script: winner.script,
      color: winnerColor
    };
  }

  // Déterminer le perdant du match
  static determineLoser(match, gameWinner) {
    if (gameWinner === 'draw') return null;
    
    const loserColor = gameWinner === 'snake1' ? 'blue' : 'red';
    const loser = match.participants.find(p => p.color === loserColor);
    
    return {
      user: loser.user,
      script: loser.script,
      color: loserColor
    };
  }

  // Mettre à jour les statistiques
  static async updateStats(match) {
    if (!match.result.winner) {
      // Match nul - mettre à jour les deux participants
      for (const participant of match.participants) {
        await User.findByIdAndUpdate(participant.user, { $inc: { 'stats.draws': 1 } });
        await Script.findByIdAndUpdate(participant.script, { $inc: { 'stats.draws': 1 } });
      }
    } else {
      // Victoire/défaite
      await User.findByIdAndUpdate(match.result.winner.user, { $inc: { 'stats.wins': 1 } });
      await Script.findByIdAndUpdate(match.result.winner.script, { $inc: { 'stats.wins': 1 } });
      
      await User.findByIdAndUpdate(match.result.loser.user, { $inc: { 'stats.losses': 1 } });
      await Script.findByIdAndUpdate(match.result.loser.script, { $inc: { 'stats.losses': 1 } });
    }
  }

  // Note: Les phases d'élimination ne sont plus nécessaires en round robin
  // Tous les matchs sont créés et exécutés directement par executeAllMatches

  // Obtenir tous les tournois (actifs ET completed pour pouvoir voir les replays)
  static async getActiveTournaments() {
    return await Tournament.find({})
      .populate('participants.user', 'username')
      .populate('participants.script', 'name code')
      .sort({ created: -1 });
  }

  // Obtenir les détails d'un tournoi
  static async getTournamentDetails(tournamentId) {
    return await Tournament.findById(tournamentId)
      .populate('participants.user', 'username stats')
      .populate('participants.script', 'name stats');
  }

  // Obtenir les données de replay d'un match
  static async getMatchReplay(matchId) {
    const match = await Match.findById(matchId)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');

    if (!match) {
      throw new Error('Match non trouvé');
    }

    return match.getReplayData();
  }

  static async updateTournament(id, data) {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    if (tournament.status !== 'registering') {
      throw new Error('Le tournoi ne peut plus être modifié');
    }

    Object.assign(tournament, {
      name: data.name,
      description: data.description,
      maxParticipants: data.maxParticipants,
      type: data.type,
      settings: {
        difficulty: data.difficulty,
        maxRounds: data.maxRounds || tournament.settings.maxRounds,
        timeoutMs: data.timeoutMs || tournament.settings.timeoutMs
      }
    });

    await tournament.save();
    return tournament;
  }

  static async deleteTournament(id) {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    if (tournament.status !== 'registering') {
      throw new Error('Le tournoi ne peut plus être supprimé');
    }

    await Tournament.deleteOne({ _id: id });
    // Supprimer aussi les matchs associés
    await Match.deleteMany({ tournament: id });
  }

  static async getTournamentById(id) {
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name code');

    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    return tournament;
  }

  // Exécuter automatiquement tous les matchs d'un tournoi
  static async executeAllMatches(tournamentId) {
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username')
      .populate('participants.script', 'name code');

    if (!tournament) {
      throw new Error('Tournoi non trouvé');
    }

    if (tournament.status !== 'running') {
      throw new Error('Le tournoi doit être en cours pour exécuter les matchs');
    }

    const participants = tournament.participants;
    const matchResults = [];

    console.log(`🚀 Exécution de tous les matchs pour le tournoi "${tournament.name}"`);
    console.log(`👥 ${participants.length} participants`);

    // Créer et exécuter tous les matchs en round-robin
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const participant1 = participants[i];
        const participant2 = participants[j];

        console.log(`\n🥊 Match: ${participant1.user.username} vs ${participant2.user.username}`);

        try {
          // Créer le match
          const match = await this.createMatch(
            tournamentId,
            'Phase de poules',
            participant1,
            participant2,
            tournament.settings
          );

          // Exécuter le match
          const executedMatch = await this.executeMatch(match._id);
          matchResults.push(executedMatch);

          console.log(`✅ Match terminé - Gagnant: ${executedMatch.result.winner ? 
            (executedMatch.result.winner.color === 'red' ? participant1.user.username : participant2.user.username) : 
            'Match nul'}`);

        } catch (error) {
          console.error(`❌ Erreur lors du match ${participant1.user.username} vs ${participant2.user.username}:`, error.message);
        }
      }
    }

    // Marquer le tournoi comme terminé
    tournament.status = 'completed';
    tournament.completedAt = new Date();
    await tournament.save();

    console.log(`\n🏆 Tournoi "${tournament.name}" terminé !`);
    console.log(`📊 ${matchResults.length} matchs exécutés`);

    return {
      tournament,
      matches: matchResults,
      totalMatches: matchResults.length
    };
  }
}

module.exports = TournamentService; 