const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const User = require('./models/User');
const Script = require('./models/Script');

async function testInscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Chercher un tournoi existant
    const tournaments = await Tournament.find({ status: 'registering' })
      .populate('participants.user', 'username email')
      .populate('participants.script', 'name description');

    if (tournaments.length === 0) {
      console.log('❌ Aucun tournoi en cours d\'inscription trouvé');
      return;
    }

    const tournament = tournaments[0];
    console.log(`\n🏆 Tournoi: "${tournament.name}"`);
    console.log(`📊 Statut: ${tournament.status}`);
    console.log(`👥 Participants: ${tournament.participants.length}/${tournament.maxParticipants}`);

    if (tournament.participants.length > 0) {
      console.log('\n📋 Liste des participants inscrits:');
      tournament.participants.forEach((participant, index) => {
        console.log(`${index + 1}. 👤 Utilisateur: ${participant.user.username} (ID: ${participant.user._id})`);
        console.log(`   📝 Script: "${participant.script.name}" (ID: ${participant.script._id})`);
        console.log(`   📅 Inscrit le: ${participant.registeredAt}`);
        console.log('');
      });

      console.log('✅ Les IDs des utilisateurs et scripts sont bien récupérés!');
    } else {
      console.log('ℹ️  Aucun participant inscrit pour le moment');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

testInscription(); 