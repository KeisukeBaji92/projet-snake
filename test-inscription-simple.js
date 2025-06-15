const mongoose = require('mongoose');
const Tournament = require('./backend/models/Tournament');
const User = require('./backend/models/User');
const Script = require('./backend/models/Script');
const TournamentService = require('./backend/services/TournamentService');

async function testInscriptionDirect() {
  console.log('🧪 Test direct d\'inscription au tournoi');
  
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');
    
    // 1. Trouver un utilisateur de test
    const user = await User.findOne({ email: 'joueur1@test.com' });
    if (!user) {
      console.log('❌ Utilisateur joueur1@test.com non trouvé');
      return;
    }
    console.log('✅ Utilisateur trouvé:', user.username, '(ID:', user._id, ')');
    
    // 2. Trouver un script de cet utilisateur
    const script = await Script.findOne({ author: user._id });
    if (!script) {
      console.log('❌ Aucun script trouvé pour cet utilisateur');
      return;
    }
    console.log('✅ Script trouvé:', script.name, '(ID:', script._id, ')');
    
    // 3. Trouver un tournoi en cours d'inscription
    const tournament = await Tournament.findOne({ status: 'registering' });
    if (!tournament) {
      console.log('❌ Aucun tournoi en cours d\'inscription');
      return;
    }
    console.log('✅ Tournoi trouvé:', tournament.name, '(ID:', tournament._id, ')');
    
    // 4. Tester l'inscription directement via le service
    console.log('\n🎯 Test inscription via TournamentService...');
    
    const result = await TournamentService.registerParticipant(
      tournament._id.toString(),
      user._id.toString(),
      script._id.toString()
    );
    
    console.log('✅ Inscription réussie !');
    console.log('🎉 Participants maintenant:', result.participants.length);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testInscriptionDirect(); 