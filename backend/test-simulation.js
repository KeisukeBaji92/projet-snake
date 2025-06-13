const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Match = require('./models/Match');
const TournamentService = require('./services/TournamentService');
const GameEngine = require('./services/GameEngine');

async function testSimulation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Chercher le tournoi avec participants
    const tournament = await Tournament.findOne({ status: 'registering' })
      .populate('participants.user', 'username email')
      .populate('participants.script', 'name code description');

    if (!tournament || tournament.participants.length < 2) {
      console.log('❌ Pas assez de participants pour simuler un match');
      return;
    }

    console.log(`\n🏆 Tournoi: "${tournament.name}"`);
    console.log(`👥 ${tournament.participants.length} participants trouvés\n`);

    // Prendre les 2 premiers participants
    const participant1 = tournament.participants[0];
    const participant2 = tournament.participants[1];

    console.log('🥊 MATCH À SIMULER:');
    console.log(`🔴 Rouge: ${participant1.user.username} avec "${participant1.script.name}"`);
    console.log(`🔵 Bleu: ${participant2.user.username} avec "${participant2.script.name}"`);
    console.log('');

    // ========== OPTION 1: Simulation directe avec GameEngine ==========
    console.log('⚡ SIMULATION DIRECTE (GameEngine):');
    console.log('───────────────────────────────────────────');

    const engine = new GameEngine({
      difficulty: 'normal',
      rows: 20,
      cols: 20,
      maxRounds: 1000,
      timeoutMs: 1000
    });

    const startTime = Date.now();
    const { result, replay } = await engine.simulateMatch(
      participant1.script.code, 
      participant2.script.code
    );
    const duration = Date.now() - startTime;

    console.log(`🏁 Match terminé en ${duration}ms`);
    console.log(`🎯 Gagnant: ${result.winner === 'snake1' ? participant1.user.username : 
                                result.winner === 'snake2' ? participant2.user.username : 'Match nul'}`);
    console.log(`📊 Score final: Rouge ${result.finalScores.red} - ${result.finalScores.blue} Bleu`);
    console.log(`🔄 Rounds joués: ${result.rounds}/${engine.settings.maxRounds}`);
    console.log(`📹 Actions enregistrées: ${replay.actions.length} frames`);

    // ========== OPTION 2: Via le système complet de tournoi ==========
    console.log('\n🏗️  SIMULATION VIA SYSTÈME TOURNOI:');
    console.log('───────────────────────────────────────────');

    // Créer un match officiel
    const match = await TournamentService.createMatch(
      tournament._id,
      'Test Match',
      participant1,
      participant2,
      tournament.settings || { difficulty: 'normal', maxRounds: 1000, timeoutMs: 1000 }
    );

    console.log(`📝 Match créé avec ID: ${match._id}`);

    // Exécuter le match
    const executedMatch = await TournamentService.executeMatch(match._id);

    console.log(`🏁 Match exécuté avec succès`);
    console.log(`🎯 Gagnant: ${executedMatch.result.winner ? executedMatch.result.winner.user : 'Match nul'}`);
    console.log(`📊 Score final: ${executedMatch.result.finalScores.red} - ${executedMatch.result.finalScores.blue}`);
    console.log(`📹 Replay disponible: ${executedMatch.replay.actions.length} actions`);

    // ========== AFFICHAGE DES PREMIÈRES ACTIONS DU REPLAY ==========
    console.log('\n🎬 APERÇU DU REPLAY (5 premières actions):');
    console.log('───────────────────────────────────────────');

    const replayActions = executedMatch.replay.actions.slice(0, 5);
    replayActions.forEach((action, index) => {
      console.log(`Round ${action.round}: Rouge→${action.snake1Move}, Bleu→${action.snake2Move}`);
      if (action.events.length > 0) {
        action.events.forEach(event => {
          console.log(`  └─ 🎯 ${event.type} (${event.snake || 'global'})`);
        });
      }
    });

    if (replay.actions.length > 5) {
      console.log(`... et ${replay.actions.length - 5} autres actions`);
    }

    console.log('\n✅ SIMULATION RÉUSSIE !');
    console.log('\n💡 Pour l\'affichage en direct:');
    console.log('   - Le replay contient toutes les données nécessaires');
    console.log('   - Utilisable avec le même composant SnakeGame du frontend');
    console.log('   - Chaque action peut être rejouée frame par frame');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

testSimulation(); 