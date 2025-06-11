const mongoose = require('mongoose');
const User = require('../models/User');
const Script = require('../models/Script');

const migrateScripts = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    
    console.log('Démarrage de la migration des scripts...');
    
    // Trouver tous les utilisateurs qui ont des scripts dans user.scripts
    const usersWithScripts = await User.find({ 'scripts.0': { $exists: true } });
    
    console.log(`Trouvé ${usersWithScripts.length} utilisateurs avec des scripts à migrer.`);
    
    let totalMigrated = 0;
    
    for (const user of usersWithScripts) {
      console.log(`Migration des scripts pour l'utilisateur: ${user.username} (${user.scripts.length} scripts)`);
      
      for (const userScript of user.scripts) {
        // Vérifier si ce script existe déjà dans la collection Script
        const existingScript = await Script.findOne({
          author: user._id,
          name: userScript.name,
          code: userScript.code
        });
        
        if (!existingScript) {
          // Créer le script dans la collection Script
          const newScript = new Script({
            name: userScript.name,
            code: userScript.code,
            author: user._id,
            created: userScript.created || new Date()
          });
          
          await newScript.save();
          totalMigrated++;
          console.log(`  ✓ Migré: ${userScript.name}`);
        } else {
          console.log(`  - Déjà existant: ${userScript.name}`);
        }
      }
    }
    
    console.log(`\nMigration terminée ! ${totalMigrated} scripts migrés.`);
    
    // Lister tous les scripts maintenant présents
    const allScripts = await Script.find().populate('author', 'username email');
    console.log(`\nTotal des scripts dans la collection Script: ${allScripts.length}`);
    
    allScripts.forEach(script => {
      console.log(`- ${script.name} (par ${script.author.username})`);
    });
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    mongoose.connection.close();
  }
};

migrateScripts(); 