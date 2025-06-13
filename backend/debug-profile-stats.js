const mongoose = require('mongoose');
const User = require('./models/User');
const Tournament = require('./models/Tournament');
const Match = require('./models/Match');
const Script = require('./models/Script');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/snake-arena', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugProfileStats() {
  try {
    console.log('🔍 DEBUG DES STATISTIQUES PROFIL');
    console.log('================================\n');

    // Prendre le premier utilisateur avec des matchs
    const userWithMatches = await User.findOne({});
    if (!userWithMatches) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    const userId = userWithMatches._id.toString();
    console.log(`👤 Utilisateur: ${userWithMatches.username} (${userId})\n`);

    // 1. Vérifier les scripts
    const scriptsCount = await Script.countDocuments({ author: userId });
    console.log(`📝 Scripts: ${scriptsCount}`);

    // 2. Vérifier les tournois
    const tournamentsParticipated = await Tournament.find({
      'participants.user': userId
    });
    const tournamentsWon = await Tournament.find({
      'winner.user': userId
    });
    console.log(`🏆 Tournois joués: ${tournamentsParticipated.length}`);
    console.log(`🏆 Tournois gagnés: ${tournamentsWon.length}\n`);

    // 3. Examiner les matchs en détail
    const matchesPlayed = await Match.find({
      'participants.user': userId,
      status: 'completed'
    }).populate('participants.user participants.script');

    console.log(`🥊 Matchs joués: ${matchesPlayed.length}\n`);

    let wins = 0, losses = 0, draws = 0;
    let maxScore = 0, longestMatchDuration = 0;
    
    console.log('📊 DÉTAIL DES MATCHS:');
    console.log('--------------------');

    for (let i = 0; i < Math.min(matchesPlayed.length, 5); i++) {
      const match = matchesPlayed[i];
      console.log(`\nMatch ${i + 1}:`);
      console.log(`  - Status: ${match.status}`);
      console.log(`  - Result:`, match.result);
      
      // Analyser le gagnant
      if (match.result?.winner?.user) {
        const winnerId = match.result.winner.user._id ? 
          match.result.winner.user._id.toString() : 
          match.result.winner.user.toString();
          
        if (winnerId === userId) {
          wins++;
          console.log(`  - 🟢 VICTOIRE pour ${userWithMatches.username}`);
        } else {
          losses++;
          console.log(`  - 🔴 DÉFAITE pour ${userWithMatches.username}`);
        }
      } else {
        draws++;
        console.log(`  - 🟡 MATCH NUL`);
      }

      // Analyser le score
      const userParticipant = match.participants.find(p => {
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId;
      });
      
      if (userParticipant && match.result?.finalScores) {
        const userScore = userParticipant.color === 'red' ? 
          match.result.finalScores.red : 
          match.result.finalScores.blue;
        
        console.log(`  - Score utilisateur: ${userScore} (couleur: ${userParticipant.color})`);
        console.log(`  - Scores finaux: Rouge ${match.result.finalScores.red} - ${match.result.finalScores.blue} Bleu`);
        
        if ((userScore || 0) > maxScore) {
          maxScore = userScore || 0;
        }
      }

      // Analyser la durée
      console.log(`  - Durée stockée: ${match.result?.duration}ms`);
      console.log(`  - Actions replay: ${match.replay?.actions?.length || 0}`);
      
      if (match.result?.duration && match.result.duration > longestMatchDuration) {
        longestMatchDuration = match.result.duration;
      }
      
      // Alternative : calculer depuis les actions du replay
      if (!match.result?.duration && match.replay?.actions?.length > 0) {
        const estimatedDuration = match.replay.actions.length * 100;
        console.log(`  - Durée estimée: ${estimatedDuration}ms`);
        if (estimatedDuration > longestMatchDuration) {
          longestMatchDuration = estimatedDuration;
        }
      }
    }

    // 4. Calculer les statistiques finales
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

    console.log('\n📈 STATISTIQUES FINALES:');
    console.log('------------------------');
    console.log(`Victoires: ${wins}`);
    console.log(`Défaites: ${losses}`);
    console.log(`Matchs nuls: ${draws}`);
    console.log(`Total matchs: ${totalGames}`);
    console.log(`Ratio victoire: ${winRate}%`);
    console.log(`Record de pommes: ${maxScore}`);
    console.log(`Plus long combat: ${longestMatchDuration}ms (${Math.round(longestMatchDuration / 1000)}s)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugProfileStats(); 