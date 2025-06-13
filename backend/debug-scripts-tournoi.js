const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Script = require('./models/Script');
const User = require('./models/User');

async function debugScriptsTournoi() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer le tournoi "Tournoi désespoir"
    const tournoi = await Tournament.findOne({ name: 'Tournoi désespoir' })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name code');

    if (!tournoi) {
      console.log('❌ Tournoi non trouvé');
      return;
    }

    console.log('\n🏆 DÉBOGAGE TOURNOI:', tournoi.name);
    console.log('👥 Participants:', tournoi.participants.length);

    for (let i = 0; i < tournoi.participants.length; i++) {
      const participant = tournoi.participants[i];
      console.log(`\n📋 PARTICIPANT ${i + 1}:`);
      console.log('  User ID:', participant.user._id);
      console.log('  Username:', participant.user.username);
      console.log('  Script ID:', participant.script._id);
      console.log('  Script Name:', participant.script.name);
      console.log('  Script Code exists:', !!participant.script.code);
      console.log('  Script Code length:', participant.script.code ? participant.script.code.length : 0);

      // Vérifier directement en base
      const scriptDirect = await Script.findById(participant.script._id);
      console.log('  ✅ Script trouvé directement:', !!scriptDirect);
      
      if (scriptDirect) {
        console.log('  ✅ Propriétaire:', scriptDirect.user);
        console.log('  ✅ Code direct length:', scriptDirect.code.length);
      }
    }

    // Test de récupération par utilisateur
    console.log('\n🔍 TEST RÉCUPÉRATION PAR USER ID:');
    for (const participant of tournoi.participants) {
      const userId = participant.user._id;
      const scripts = await Script.find({ user: userId });
      console.log(`User ${participant.user.username}: ${scripts.length} scripts trouvés`);
      scripts.forEach(script => {
        console.log(`  - ${script.name} (${script._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugScriptsTournoi(); 