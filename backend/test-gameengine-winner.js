const GameEngine = require('./services/GameEngine');

// Test simple du moteur de jeu pour la détermination du gagnant
async function testGameEngineWinner() {
  console.log('🎮 TEST DU MOTEUR DE JEU - DÉTERMINATION DU GAGNANT');
  console.log('===================================================\n');

  // Script qui va vers la nourriture
  const smartScript = {
    code: `
import json
import sys

# Lire les données du jeu
game_data = json.loads(sys.stdin.read())

head = game_data["my_snake"]["head"]
food = game_data["food"]

# Aller vers la nourriture
if food["x"] > head["x"]:
    action = "down"
elif food["x"] < head["x"]:
    action = "up"
elif food["y"] > head["y"]:
    action = "right"
else:
    action = "left"

result = {"action": action}
print(json.dumps(result))
`
  };

  // Script qui va dans un cercle (devrait moins bien performer)
  const circleScript = {
    code: `
import json
import sys

# Lire les données du jeu  
game_data = json.loads(sys.stdin.read())

turn = game_data.get("turn", 0)

# Mouvement en cercle : right -> down -> left -> up -> repeat
directions = ["right", "down", "left", "up"]
action = directions[turn % 4]

result = {"action": action}
print(json.dumps(result))
`
  };

  try {
    console.log('🔄 Simulation d\'un match (smart vs circle)...');
    const result1 = await GameEngine.simulateMatch(smartScript, circleScript);
    
    console.log('\n📊 RÉSULTATS MATCH 1:');
    console.log('---------------------');
    console.log(`Gagnant: ${result1.winner}`);
    console.log(`Score Rouge (smart): ${result1.finalScores.red}`);
    console.log(`Score Bleu (circle): ${result1.finalScores.blue}`);
    console.log(`Nombre de tours: ${result1.moves}`);
    console.log(`Durée: ${result1.duration}ms`);
    
    // Vérifier la logique
    if (result1.finalScores.red > result1.finalScores.blue) {
      console.log(`\n✅ Rouge a un meilleur score (${result1.finalScores.red} > ${result1.finalScores.blue})`);
      if (result1.winner === 'script1') {
        console.log('✅ Le gagnant est correctement script1 (rouge)');
      } else {
        console.log(`❌ ERREUR: Le gagnant devrait être script1 mais est ${result1.winner}`);
      }
    } else if (result1.finalScores.blue > result1.finalScores.red) {
      console.log(`\n✅ Bleu a un meilleur score (${result1.finalScores.blue} > ${result1.finalScores.red})`);
      if (result1.winner === 'script2') {
        console.log('✅ Le gagnant est correctement script2 (bleu)');
      } else {
        console.log(`❌ ERREUR: Le gagnant devrait être script2 mais est ${result1.winner}`);
      }
    } else {
      console.log(`\n⚖️ Scores égaux (${result1.finalScores.red} = ${result1.finalScores.blue})`);
      if (result1.winner === 'draw') {
        console.log('✅ Correctement identifié comme match nul');
      } else {
        console.log(`❌ ERREUR: Devrait être un match nul mais gagnant = ${result1.winner}`);
      }
    }

    // Test inverse pour vérifier la cohérence
    console.log('\n\n🔄 Simulation d\'un match inverse (circle vs smart)...');
    const result2 = await GameEngine.simulateMatch(circleScript, smartScript);
    
    console.log('\n📊 RÉSULTATS MATCH 2:');
    console.log('---------------------');
    console.log(`Gagnant: ${result2.winner}`);
    console.log(`Score Rouge (circle): ${result2.finalScores.red}`);
    console.log(`Score Bleu (smart): ${result2.finalScores.blue}`);
    console.log(`Nombre de tours: ${result2.moves}`);
    console.log(`Durée: ${result2.duration}ms`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la simulation:', error);
  }
}

testGameEngineWinner(); 