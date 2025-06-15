const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('📡 Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('👑 Un administrateur existe déjà:', existingAdmin.username);
      process.exit(0);
    }

    // Créer un utilisateur admin
    const admin = new User({
      username: 'admin',
      email: 'admin@snake-arena.com',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Administrateur créé avec succès!');
    console.log('👤 Username: admin');
    console.log('📧 Email: admin@snake-arena.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

    // Créer aussi quelques utilisateurs de test
    const users = [
      {
        username: 'joueur1',
        email: 'joueur1@test.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'joueur2',
        email: 'joueur2@test.com',
        password: 'password123',
        role: 'user'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Utilisateur ${userData.username} créé`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin(); 