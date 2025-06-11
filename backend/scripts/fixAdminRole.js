const mongoose = require('mongoose');
const User = require('../models/User');

const fixAdminRole = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    
    // Mettre à jour l'utilisateur admin
    const result = await User.updateOne(
      { email: 'admin@snakearena.com' },
      { $set: { role: 'admin' } }
    );
    
    console.log('Résultat de la mise à jour:', result);
    
    // Vérifier le résultat
    const admin = await User.findOne({ email: 'admin@snakearena.com' });
    console.log('Utilisateur après mise à jour:');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixAdminRole(); 