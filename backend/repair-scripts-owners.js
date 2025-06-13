const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Script = require('./models/Script');
const User = require('./models/User');

async function repairScriptsOwners() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer le tournoi avec les participants
    const tournoi = await Tournament.findOne({ name: 'Tournoi désespoir' })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');

    console.log('\n🔧 RÉPARATION DES PROPRIÉTAIRES DE SCRIPTS');
    console.log('─'.repeat(50));

    for (const participant of tournoi.participants) {
      const userId = participant.user._id;
      const scriptId = participant.script._id;
      const username = participant.user.username;
      const scriptName = participant.script.name;

      console.log(`\n📝 Réparation: ${scriptName} → ${username}`);
      
      // Mettre à jour le script avec le bon propriétaire
      const result = await Script.updateOne(
        { _id: scriptId },
        { $set: { user: userId } }
      );

      if (result.modifiedCount > 0) {
        console.log('  ✅ Propriétaire mis à jour');
      } else {
        console.log('  ⚠️ Aucune modification');
      }
    }

    // Vérification après réparation
    console.log('\n🔍 VÉRIFICATION APRÈS RÉPARATION:');
    console.log('─'.repeat(50));

    for (const participant of tournoi.participants) {
      const userId = participant.user._id;
      const scripts = await Script.find({ user: userId });
      console.log(`${participant.user.username}: ${scripts.length} scripts trouvés`);
      scripts.forEach(script => {
        console.log(`  ✅ ${script.name} (${script._id})`);
      });
    }

    console.log('\n✅ Réparation terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

repairScriptsOwners(); 