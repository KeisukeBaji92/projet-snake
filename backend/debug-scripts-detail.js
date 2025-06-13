const mongoose = require('mongoose');
const Script = require('./models/Script');
const User = require('./models/User');

async function debugScriptsDetail() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les scripts
    const scripts = await Script.find({});
    console.log(`\n📚 TOUS LES SCRIPTS (${scripts.length} trouvés):`);
    console.log('─'.repeat(60));

    for (const script of scripts) {
      console.log(`\n📝 Script: ${script.name}`);
      console.log(`  ID: ${script._id}`);
      console.log(`  User field: ${script.user}`);
      console.log(`  User type: ${typeof script.user}`);
      console.log(`  User exists: ${!!script.user}`);
      
      if (script.user) {
        // Essayer de récupérer l'utilisateur
        try {
          const user = await User.findById(script.user);
          console.log(`  User found: ${user ? user.username : 'NOT FOUND'}`);
        } catch (error) {
          console.log(`  User lookup error: ${error.message}`);
        }
      }
    }

    // Test de recherche par utilisateur spécifique
    console.log('\n🔍 TEST RECHERCHE PAR USER SPÉCIFIQUE:');
    const userIds = [
      '683b77ea8f6f6a154b0692a2', // ZAWARUDO
      '6849a23dcd10c55db6309ff9'  // ZAWARUDO2
    ];

    for (const userId of userIds) {
      console.log(`\nRecherche scripts pour user ${userId}:`);
      
      // Différentes méthodes de recherche
      const method1 = await Script.find({ user: userId });
      const method2 = await Script.find({ user: new mongoose.Types.ObjectId(userId) });
      const method3 = await Script.find({ user: { $eq: userId } });
      
      console.log(`  Méthode 1 (string): ${method1.length} scripts`);
      console.log(`  Méthode 2 (ObjectId): ${method2.length} scripts`);
      console.log(`  Méthode 3 ($eq): ${method3.length} scripts`);
      
      if (method2.length > 0) {
        method2.forEach(script => {
          console.log(`    ✅ ${script.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugScriptsDetail(); 