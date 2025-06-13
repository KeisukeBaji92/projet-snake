const TournamentService = require('./services/TournamentService');
const connectDB = require('./config/db');

async function testTournamentExecution() {
  try {
    await connectDB();
    console.log('🔗 Connecté à la base de données');

    // Trouver le tournoi "Tournoi désespoir"
    const Tournament = require('./models/Tournament');
    const tournament = await Tournament.findOne({ name: 'Tournoi désespoir' })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');

    if (!tournament) {
      console.log('❌ Tournoi "Tournoi désespoir" non trouvé');
      process.exit(1);
    }

    console.log(`\n🏆 Tournoi trouvé: "${tournament.name}"`);
    console.log(`📊 Statut: ${tournament.status}`);
    console.log(`👥 Participants: ${tournament.participants.length}`);
    
    tournament.participants.forEach((participant, index) => {
      console.log(`   ${index + 1}. ${participant.user?.username} (${participant.script?.name})`);
    });

    if (tournament.status !== 'running') {
      console.log('⚠️  Le tournoi n\'est pas en statut "running"');
      console.log('   Changement de statut en "running"...');
      tournament.status = 'running';
      await tournament.save();
    }

    // Vérifier les matchs existants
    const Match = require('./models/Match');
    const existingMatches = await Match.find({ tournament: tournament._id });
    
    if (existingMatches.length > 0) {
      console.log(`\n🗑️  Suppression des ${existingMatches.length} matchs existants...`);
      await Match.deleteMany({ tournament: tournament._id });
    }

    // Exécuter tous les matchs
    console.log('\n🚀 Lancement de l\'exécution automatique...');
    const result = await TournamentService.executeAllMatches(tournament._id);

    console.log('\n✅ Exécution terminée !');
    console.log(`📊 Résultats:`);
    console.log(`   - Tournoi: ${result.tournament.name}`);
    console.log(`   - Statut final: ${result.tournament.status}`);
    console.log(`   - Matchs exécutés: ${result.totalMatches}`);

    // Vérifier les matchs créés
    const finalMatches = await Match.find({ tournament: tournament._id })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');

    console.log('\n🥊 Détails des matchs:');
    finalMatches.forEach((match, index) => {
      const user1 = match.participants[0]?.user?.username || 'Joueur 1';
      const user2 = match.participants[1]?.user?.username || 'Joueur 2';
      const script1 = match.participants[0]?.script?.name || 'Script 1';
      const script2 = match.participants[1]?.script?.name || 'Script 2';
      
      const winner = match.result?.winner ? 
        (match.result.winner.color === 'red' ? user1 : user2) : 
        'Match nul';
      
      const events = match.replay?.actions?.length || 0;
      
      console.log(`   ${index + 1}. ${user1} (${script1}) vs ${user2} (${script2})`);
      console.log(`      🏆 Gagnant: ${winner}`);
      console.log(`      🎬 Événements: ${events} frames`);
      console.log(`      📅 Créé: ${match.created?.toLocaleString()}`);
    });

    console.log('\n🎯 Test complet - Le système de tournoi fonctionne !');
    console.log('   Vous pouvez maintenant tester l\'interface web:');
    console.log('   1. Aller sur http://localhost:3000');
    console.log('   2. Se connecter en admin');
    console.log('   3. Cliquer sur "🧪 Test Match"');
    console.log('   4. Sélectionner "Tournoi désespoir"');
    console.log('   5. Visionner les replays des matchs !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

// Lancer le test
testTournamentExecution(); 