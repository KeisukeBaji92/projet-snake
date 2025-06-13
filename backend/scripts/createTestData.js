const mongoose = require('mongoose');
const User = require('../models/User');
const Script = require('../models/Script');
const bcrypt = require('bcryptjs');

// Se connecter à MongoDB
mongoose.connect('mongodb://localhost:27017/snake-tournament', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const greedyScript = `#!/usr/bin/env python3
import json
import sys

def get_next_action(game_data):
    """
    Script glouton - va toujours vers la nourriture.
    """
    my_snake = game_data['my_snake']
    food = game_data['food']
    grid_size = game_data['grid_size']
    
    head = my_snake['head']
    current_direction = my_snake['direction']
    
    # Éviter de revenir sur soi-même
    opposites = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
    possible_actions = ['up', 'down', 'left', 'right']
    if opposites[current_direction] in possible_actions:
        possible_actions.remove(opposites[current_direction])
    
    # Calculer les positions suivantes
    next_positions = {}
    for action in possible_actions:
        next_pos = head.copy()
        if action == 'up': next_pos[0] -= 1
        elif action == 'down': next_pos[0] += 1
        elif action == 'left': next_pos[1] -= 1
        elif action == 'right': next_pos[1] += 1
        next_positions[action] = next_pos
    
    # Éliminer les collisions avec les murs
    valid_actions = []
    for action, pos in next_positions.items():
        if (0 <= pos[0] < grid_size['rows'] and 0 <= pos[1] < grid_size['cols']):
            valid_actions.append(action)
    
    if not valid_actions:
        return current_direction
    
    # Aller vers la nourriture
    best_action = valid_actions[0]
    min_distance = float('inf')
    
    for action in valid_actions:
        pos = next_positions[action]
        distance = abs(pos[0] - food[0]) + abs(pos[1] - food[1])
        if distance < min_distance:
            min_distance = distance
            best_action = action
    
    return best_action

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

const randomScript = `#!/usr/bin/env python3
import json
import sys
import random

def get_next_action(game_data):
    """
    Script aléatoire - choisit une direction au hasard (mais évite les murs).
    """
    my_snake = game_data['my_snake']
    grid_size = game_data['grid_size']
    
    head = my_snake['head']
    current_direction = my_snake['direction']
    
    # Éviter de revenir sur soi-même
    opposites = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
    possible_actions = ['up', 'down', 'left', 'right']
    if opposites[current_direction] in possible_actions:
        possible_actions.remove(opposites[current_direction])
    
    # Éliminer les actions qui mènent aux murs
    valid_actions = []
    for action in possible_actions:
        next_pos = head.copy()
        if action == 'up': next_pos[0] -= 1
        elif action == 'down': next_pos[0] += 1
        elif action == 'left': next_pos[1] -= 1
        elif action == 'right': next_pos[1] += 1
        
        if (0 <= next_pos[0] < grid_size['rows'] and 0 <= next_pos[1] < grid_size['cols']):
            valid_actions.append(action)
    
    if not valid_actions:
        return current_direction
    
    return random.choice(valid_actions)

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

const defensiveScript = `#!/usr/bin/env python3
import json
import sys

def get_next_action(game_data):
    """
    Script défensif - évite l'ennemi en priorité.
    """
    my_snake = game_data['my_snake']
    enemy_snake = game_data['enemy_snake']
    grid_size = game_data['grid_size']
    
    head = my_snake['head']
    enemy_head = enemy_snake['head']
    current_direction = my_snake['direction']
    
    # Éviter de revenir sur soi-même
    opposites = {'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'}
    possible_actions = ['up', 'down', 'left', 'right']
    if opposites[current_direction] in possible_actions:
        possible_actions.remove(opposites[current_direction])
    
    # Calculer les positions suivantes et leur distance à l'ennemi
    action_scores = {}
    for action in possible_actions:
        next_pos = head.copy()
        if action == 'up': next_pos[0] -= 1
        elif action == 'down': next_pos[0] += 1
        elif action == 'left': next_pos[1] -= 1
        elif action == 'right': next_pos[1] += 1
        
        # Vérifier si dans les limites
        if not (0 <= next_pos[0] < grid_size['rows'] and 0 <= next_pos[1] < grid_size['cols']):
            continue
            
        # Calculer la distance à l'ennemi (plus c'est loin, mieux c'est)
        distance = abs(next_pos[0] - enemy_head[0]) + abs(next_pos[1] - enemy_head[1])
        action_scores[action] = distance
    
    if not action_scores:
        return current_direction
    
    # Choisir l'action qui nous éloigne le plus de l'ennemi
    best_action = max(action_scores.keys(), key=lambda k: action_scores[k])
    return best_action

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

async function createTestData() {
  try {
    console.log('🔧 Création des données de test...');
    
    // Créer des utilisateurs de test
    const users = [
      { username: 'alice', email: 'alice@test.com', password: 'test123' },
      { username: 'bob', email: 'bob@test.com', password: 'test123' },
      { username: 'charlie', email: 'charlie@test.com', password: 'test123' },
      { username: 'diana', email: 'diana@test.com', password: 'test123' }
    ];
    
    const createdUsers = [];
    
    for (const userData of users) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`👤 Utilisateur ${userData.username} existe déjà`);
        createdUsers.push(existingUser);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword
      });
      
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Utilisateur créé: ${user.username}`);
    }
    
    // Créer des scripts pour chaque utilisateur
    const scriptsData = [
      { name: 'Glouton', code: greedyScript, description: 'Va toujours vers la nourriture' },
      { name: 'Aléatoire', code: randomScript, description: 'Mouvements aléatoires sécurisés' },
      { name: 'Défensif', code: defensiveScript, description: 'Évite l\'ennemi' },
      { name: 'Glouton2', code: greedyScript, description: 'Autre version gloutonne' }
    ];
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const scriptData = scriptsData[i];
      
      // Vérifier si le script existe déjà
      const existingScript = await Script.findOne({ 
        author: user._id, 
        name: scriptData.name 
      });
      
      if (existingScript) {
        console.log(`🐍 Script ${scriptData.name} existe déjà pour ${user.username}`);
        continue;
      }
      
      const script = new Script({
        name: scriptData.name,
        description: scriptData.description,
        code: scriptData.code,
        author: user._id,
        language: 'python'
      });
      
      await script.save();
      console.log(`🐍 Script créé: ${scriptData.name} pour ${user.username}`);
    }
    
    console.log('✅ Données de test créées avec succès !');
    console.log('');
    console.log('Comptes créés:');
    console.log('- alice@test.com / test123');
    console.log('- bob@test.com / test123');
    console.log('- charlie@test.com / test123');
    console.log('- diana@test.com / test123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTestData(); 