const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

mongoose.connect('mongodb://localhost:27017/snake-arena', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetTournament() {
  try {
    const result = await Tournament.updateOne(
      { name: 'Tournoi test 3' },
      { $set: { status: 'registering' } }
    );
    
    console.log('✅ Tournoi remis en état:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetTournament(); 