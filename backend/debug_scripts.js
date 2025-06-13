const mongoose = require('mongoose');
const Script = require('./models/Script');
const User = require('./models/User');

async function debugScripts() {
  try {
    // Se connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connecté à MongoDB');

    // Lister tous les utilisateurs
    const users = await User.find({}, 'username email _id');
    console.log('\n👥 Utilisateurs dans la base:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) -> ID: ${user._id}`);
    });

    // Lister tous les scripts avec leurs auteurs
    const scripts = await Script.find({}).populate('author', 'username email');
    console.log('\n📝 Scripts dans la base:');
    scripts.forEach(script => {
      console.log(`- "${script.name}" par ${script.author?.username || 'AUTEUR MANQUANT'} (ID auteur: ${script.author?._id || script.author})`);
    });

    // Vérifier les scripts pour un utilisateur spécifique (ZAWARUDO)
    const zawarudoUser = await User.findOne({ username: 'ZAWARUDO' });
    if (zawarudoUser) {
      console.log(`\n🔍 Scripts pour ZAWARUDO (ID: ${zawarudoUser._id}):`);
      const zawarudoScripts = await Script.find({ author: zawarudoUser._id });
      console.log(`Trouvés: ${zawarudoScripts.length} scripts`);
      zawarudoScripts.forEach(script => {
        console.log(`- ${script.name}`);
      });
    } else {
      console.log('\n❌ Utilisateur ZAWARUDO non trouvé!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

debugScripts(); 