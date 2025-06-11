require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un administrateur existe déjà:', existingAdmin.username);
      process.exit(0);
    }

    // Créer un nouvel admin
    const admin = new User({
      username: 'admin',
      email: 'admin@snake-arena.com',
      password: 'admin123', // Sera hashé automatiquement
      role: 'admin'
    });

    await admin.save();
    console.log('Administrateur créé avec succès !');
    console.log('Email: admin@snake-arena.com');
    console.log('Mot de passe: admin123');
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Lancer le script seulement s'il est exécuté directement
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin; 