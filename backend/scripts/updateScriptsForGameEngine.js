const mongoose = require('mongoose');
const Script = require('../models/Script');

// Se connecter à MongoDB
mongoose.connect('mongodb://localhost:27017/snake-tournament', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const modernSnakeTemplate = `#!/usr/bin/env python3
import json
import sys
import random

def get_next_action(game_data):
    """
    Stratégie adaptée du script original pour le nouveau moteur de jeu.
    """
    my_snake = game_data['my_snake']
    enemy_snake = game_data['enemy_snake']
    food = game_data['food']
    grid_size = game_data['grid_size']
    
    head = my_snake['head']
    current_direction = my_snake['direction']
    
    # Actions possibles
    actions = ['up', 'down', 'left', 'right']
    
    # Éviter de revenir sur soi-même
    opposites = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
    if opposites[current_direction] in actions:
        actions.remove(opposites[current_direction])
    
    # Calculer les positions suivantes
    next_positions = {}
    for action in actions:
        next_pos = head.copy()
        if action == 'up': next_pos[0] -= 1
        elif action == 'down': next_pos[0] += 1
        elif action == 'left': next_pos[1] -= 1
        elif action == 'right': next_pos[1] += 1
        next_positions[action] = next_pos
    
    # Éliminer les collisions avec les murs
    safe_actions = []
    for action, pos in next_positions.items():
        if (0 <= pos[0] < grid_size['rows'] and 0 <= pos[1] < grid_size['cols']):
            safe_actions.append(action)
    
    # Éliminer les collisions avec les serpents
    all_bodies = my_snake['body'] + enemy_snake['body']
    collision_free = []
    for action in safe_actions:
        if next_positions[action] not in all_bodies:
            collision_free.append(action)
    
    if not collision_free:
        collision_free = safe_actions if safe_actions else actions
    
    # STRATÉGIE ORIGINALE ADAPTÉE CI-DESSOUS
    if collision_free:
        # Aller vers la nourriture
        best_action = collision_free[0]
        min_distance = float('inf')
        
        for action in collision_free:
            pos = next_positions[action]
            distance = abs(pos[0] - food[0]) + abs(pos[1] - food[1])
            if distance < min_distance:
                min_distance = distance
                best_action = action
        
        return best_action
    
    return current_direction

def main():
    try:
        input_data = sys.stdin.read()
        game_data = json.loads(input_data)
        action = get_next_action(game_data)
        response = {"action": action}
        print(json.dumps(response))
    except Exception as e:
        print(json.dumps({"action": "up"}))

if __name__ == "__main__":
    main()
`;

async function updateScripts() {
  try {
    console.log('🔄 Mise à jour des scripts pour le nouveau moteur de jeu...');
    
    const scripts = await Script.find({});
    console.log(`📝 ${scripts.length} scripts trouvés`);
    
    for (const script of scripts) {
      console.log(`🐍 Mise à jour: ${script.name}`);
      
      // Remplacer le code par le template moderne avec la stratégie adaptée
      let newCode = modernSnakeTemplate;
      
      // Personnaliser selon le nom du script
      switch (script.name.toLowerCase()) {
        case 'random':
          newCode = newCode.replace(
            'return best_action',
            'return random.choice(collision_free)'
          );
          break;
          
        case 'zigzag':
          newCode = newCode.replace(
            'return best_action',
            `# Stratégie zigzag
        turn = game_data['turn']
        if turn % 10 < 5:
            preferred = ['right', 'left']
        else:
            preferred = ['down', 'up']
        
        for pref in preferred:
            if pref in collision_free:
                return pref
        return best_action`
          );
          break;
          
        case 'spirale':
          newCode = newCode.replace(
            'return best_action',
            `# Stratégie spirale
        directions = ['right', 'down', 'left', 'up']
        turn = game_data['turn']
        spiral_dir = directions[turn % 4]
        
        if spiral_dir in collision_free:
            return spiral_dir
        return best_action`
          );
          break;
          
        case 'défensif':
        case 'defensif':
          newCode = newCode.replace(
            'return best_action',
            `# Stratégie défensive - éviter l'ennemi
        enemy_head = enemy_snake['head']
        
        # Choisir l'action qui nous éloigne le plus de l'ennemi
        best_distance = -1
        best_defensive_action = best_action
        
        for action in collision_free:
            pos = next_positions[action]
            distance = abs(pos[0] - enemy_head[0]) + abs(pos[1] - enemy_head[1])
            if distance > best_distance:
                best_distance = distance
                best_defensive_action = action
        
        return best_defensive_action`
          );
          break;
      }
      
      script.code = newCode;
      await script.save();
      
      console.log(`✅ ${script.name} mis à jour`);
    }
    
    console.log('🎉 Tous les scripts ont été mis à jour avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateScripts(); 