const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Script = require('./models/Script');
const User = require('./models/User');

async function fixScriptsOwnership() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer le tournoi avec les participants
    const tournoi = await Tournament.findOne({ name: 'Tournoi désespoir' })
      .populate('participants.user', 'username')
      .populate('participants.script', 'name');

    console.log('\n🔧 CORRECTION PROPRIÉTÉ DES SCRIPTS');
    console.log('─'.repeat(50));

    for (const participant of tournoi.participants) {
      const userId = participant.user._id;
      const scriptId = participant.script._id;
      const username = participant.user.username;
      const scriptName = participant.script.name;

      console.log(`\n📝 Attribution: ${scriptName} → ${username}`);
      console.log(`   Script ID: ${scriptId}`);
      console.log(`   User ID: ${userId}`);
      
      // Mettre à jour directement dans la base
      const result = await Script.updateOne(
        { _id: scriptId },
        { $set: { user: userId } },
        { upsert: false }
      );

      console.log(`   Modified: ${result.modifiedCount}`);
      console.log(`   Matched: ${result.matchedCount}`);

      // Vérification immédiate
      const scriptUpdated = await Script.findById(scriptId);
      console.log(`   ✅ Nouveau owner: ${scriptUpdated.user || 'STILL UNDEFINED'}`);
    }

    // Vérification finale avec recherche
    console.log('\n🔍 VÉRIFICATION FINALE:');
    console.log('─'.repeat(50));

    for (const participant of tournoi.participants) {
      const userId = participant.user._id;
      const scripts = await Script.find({ user: userId });
      console.log(`\n${participant.user.username} (${userId}):`);
      console.log(`  Scripts trouvés: ${scripts.length}`);
      
      scripts.forEach(script => {
        console.log(`    ✅ ${script.name} (${script._id})`);
      });

      if (scripts.length === 0) {
        console.log('  ❌ Aucun script trouvé pour cet utilisateur !');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

fixScriptsOwnership(); 