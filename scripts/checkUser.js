const mongoose = require('mongoose');
const User = require('../models/User');

const checkUser = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    
    // Trouver l'utilisateur admin
    const admin = await User.findOne({ email: 'admin@snakearena.com' });
    
    if (!admin) {
      console.log('Utilisateur admin@snakearena.com non trouvé');
    } else {
      console.log('Utilisateur trouvé:');
      console.log('Username:', admin.username);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Password hash:', admin.password.substring(0, 20) + '...');
      
      // Tester le mot de passe
      const isPasswordValid = await admin.comparePassword('admin123');
      console.log('Mot de passe "admin123" valide:', isPasswordValid);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkUser(); 