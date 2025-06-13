const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

async function checkTournament() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    
    // Prendre un tournoi terminé
    const tournament = await Tournament.findOne({ status: 'completed' })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name')
      .populate('winner.user', 'username')
      .populate('winner.script', 'name')
      .populate({
        path: 'phases.matches',
        populate: {
          path: 'participants.user participants.script',
          select: 'username name'
        }
      });
    
    if (tournament) {
      console.log('=== TOURNOI TERMINÉ ===');
      console.log('Nom:', tournament.name);
      console.log('Status:', tournament.status);
      console.log('Participants:', tournament.participants.length);
      console.log('Phases:', tournament.phases.length);
      tournament.phases.forEach((phase, i) => {
        console.log(`Phase ${i}:`, phase.name, '- Matches:', phase.matches.length, 'Completed:', phase.completed);
        if (phase.matches.length > 0) {
          console.log('  Match IDs:', phase.matches.map(m => m._id || m));
        }
      });
      if (tournament.winner) {
        console.log('Gagnant:', tournament.winner.user.username);
      }
    } else {
      console.log('Aucun tournoi terminé trouvé');
    }
    
    // Vérifier aussi les matches
    const Match = require('../models/Match');
    const matches = await Match.find({ tournament: tournament?._id })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');
    
    console.log('\n=== MATCHES ASSOCIÉS ===');
    console.log('Nombre de matches:', matches.length);
    matches.forEach((match, i) => {
      console.log(`Match ${i + 1}:`, match.status, '- Participants:', match.participants.length);
      if (match.result) {
        console.log('  Résultat:', match.result.winner ? 'Gagnant trouvé' : 'Pas de gagnant');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkTournament(); 