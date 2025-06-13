const mongoose = require('mongoose');
const Match = require('./models/Match');
const GameEngine = require('./services/GameEngine');
const Script = require('./models/Script');

async function testMongooseSave() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer les scripts de test
    const scripts = await Script.find().limit(2);
    const script1 = scripts[0].code;
    const script2 = scripts[1].code;

    console.log('\n🧪 TEST SAUVEGARDE MONGOOSE:');
    console.log('─'.repeat(50));

    // Simuler avec GameEngine
    const engine = new GameEngine({ maxRounds: 5 });
    const { result, replay } = await engine.simulateMatch(script1, script2);

    console.log('🎯 Replay original généré');
    console.log('Actions:', replay.actions.length);
    
    if (replay.actions.length > 0) {
      console.log('Premier events:', JSON.stringify(replay.actions[0].events));
    }

    // Créer un match factice pour tester
    const testMatch = new Match({
      tournament: new mongoose.Types.ObjectId(),
      phase: 'Test',
      participants: [
        {
          user: new mongoose.Types.ObjectId(),
          script: new mongoose.Types.ObjectId(),
          color: 'red'
        },
        {
          user: new mongoose.Types.ObjectId(),
          script: new mongoose.Types.ObjectId(),
          color: 'blue'
        }
      ],
      settings: {
        difficulty: 'normal',
        gridSize: { rows: 20, cols: 20 },
        maxRounds: 1000,
        timeoutMs: 10000
      },
      replay: replay,
      status: 'completed'
    });

    console.log('\n💾 Tentative de sauvegarde...');
    
    try {
      await testMatch.save();
      console.log('✅ Sauvegarde réussie !');
    } catch (error) {
      console.log('❌ Erreur de sauvegarde:');
      console.log(error.message);
      
      // Analyser l'erreur en détail
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.log(`\n🔍 Erreur sur "${key}":`);
          console.log('Value:', error.errors[key].value);
          console.log('Type:', typeof error.errors[key].value);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testMongooseSave(); 