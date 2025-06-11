const mongoose = require('mongoose');
const User = require('../models/User');

const listAdmins = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    
    // Trouver tous les admins
    const admins = await User.find({ role: 'admin' }).select('username email role');
    
    console.log('Utilisateurs administrateurs trouvés:');
    if (admins.length === 0) {
      console.log('Aucun administrateur trouvé.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}`);
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la recherche des admins:', error);
  } finally {
    mongoose.connection.close();
  }
};

listAdmins(); 