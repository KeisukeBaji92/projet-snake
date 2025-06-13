const mongoose = require('mongoose');
const GameEngine = require('./services/GameEngine');
const Script = require('./models/Script');

async function testReplayFormat() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    // Récupérer les scripts de test
    const scripts = await Script.find().limit(2);
    const script1 = scripts[0].code;
    const script2 = scripts[1].code;

    console.log('\n📝 ANALYSE DU FORMAT DE REPLAY:');
    console.log('─'.repeat(50));

    // Test du GameEngine
    const engine = new GameEngine({ maxRounds: 10 });
    const { result, replay } = await engine.simulateMatch(script1, script2);

    console.log('\n🔍 Structure du replay:');
    console.log('Type de replay:', typeof replay);
    console.log('Type de replay.actions:', typeof replay.actions);
    console.log('Nombre d\'actions:', replay.actions.length);

    if (replay.actions.length > 0) {
      const firstAction = replay.actions[0];
      console.log('\n🎬 Première action:');
      console.log('Type events:', typeof firstAction.events);
      console.log('Array.isArray(events):', Array.isArray(firstAction.events));
      console.log('Events:', JSON.stringify(firstAction.events, null, 2));
    }

    // Test de sérialisation JSON
    console.log('\n📤 TEST DE SÉRIALISATION:');
    const serialized = JSON.stringify(replay);
    const deserialized = JSON.parse(serialized);
    
    console.log('Après JSON.parse, type events:', typeof deserialized.actions[0].events);
    console.log('Après JSON.parse, Array.isArray:', Array.isArray(deserialized.actions[0].events));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testReplayFormat(); 