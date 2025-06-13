const mongoose = require('mongoose');
const Match = require('./models/Match');

async function testEventsSpecific() {
  try {
    await mongoose.connect('mongodb://localhost:27017/snake-arena');
    console.log('✅ Connecté à MongoDB');

    console.log('\n🎯 TEST SPÉCIFIQUE DES ÉVÉNEMENTS:');
    console.log('─'.repeat(50));

    // Créer des données de replay avec différents types d'événements
    const replayData = {
      seed: 12345,
      initialState: {
        snake1: [{x: 5, y: 5}],
        snake2: [{x: 15, y: 15}],
        food: {x: 10, y: 10},
        bombs: []
      },
      actions: [
        {
          round: 1,
          snake1Move: 'right',
          snake2Move: 'left',
          events: [], // Événements vides
          state: {
            snake1: [{x: 6, y: 5}],
            snake2: [{x: 14, y: 15}],
            food: {x: 10, y: 10},
            scores: {s1: 0, s2: 0}
          }
        },
        {
          round: 2,
          snake1Move: 'right',
          snake2Move: 'left',
          events: [
            {
              type: 'food_eaten',
              snake: 'snake1',
              position: {x: 10, y: 10}
            },
            {
              type: 'new_food',
              position: {x: 5, y: 5}
            }
          ],
          state: {
            snake1: [{x: 10, y: 10}, {x: 6, y: 5}],
            snake2: [{x: 13, y: 15}],
            food: {x: 5, y: 5},
            scores: {s1: 1, s2: 0}
          }
        }
      ]
    };

    console.log('📄 Données de replay créées');
    console.log('Action 1 events:', JSON.stringify(replayData.actions[0].events));
    console.log('Action 2 events:', JSON.stringify(replayData.actions[1].events));

    const testMatch = new Match({
      tournament: new mongoose.Types.ObjectId(),
      phase: 'Test spécifique',
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
      replay: replayData,
      status: 'completed'
    });

    console.log('\n💾 Tentative de sauvegarde avec événements...');
    
    try {
      await testMatch.save();
      console.log('✅ Sauvegarde réussie avec événements !');
      
      // Relire pour vérifier
      const savedMatch = await Match.findById(testMatch._id);
      console.log('\n🔍 Vérification après lecture:');
      console.log('Events action 2:', JSON.stringify(savedMatch.replay.actions[1].events));
      
    } catch (error) {
      console.log('❌ Erreur de sauvegarde avec événements:');
      console.log(error.message);
      
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.log(`\n🔍 Erreur sur "${key}":`);
          console.log('Value type:', typeof error.errors[key].value);
          console.log('Value preview:', String(error.errors[key].value).substring(0, 100));
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

testEventsSpecific(); 