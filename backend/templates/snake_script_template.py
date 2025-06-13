#!/usr/bin/env python3
"""
Template de script Snake pour le moteur de tournoi

Ce script reçoit l'état du jeu via stdin au format JSON et doit retourner
une action via stdout au format JSON.

Format d'entrée (stdin):
{
  "grid_size": {"rows": 20, "cols": 20},
  "turn": 123,
  "my_snake": {
    "head": [10, 5],
    "body": [[10, 5], [10, 4], [10, 3]],
    "direction": "up",
    "score": 30,
    "alive": true
  },
  "enemy_snake": {
    "head": [10, 15], 
    "body": [[10, 15], [10, 16], [10, 17]],
    "direction": "up",
    "score": 20,
    "alive": true
  },
  "food": [5, 8]
}

Format de sortie (stdout):
{"action": "up"}

Actions possibles: "up", "down", "left", "right"
"""

import json
import sys
import random

def get_next_action(game_data):
    """
    Fonction principale qui détermine la prochaine action du serpent.
    
    Args:
        game_data (dict): État du jeu reçu du moteur
    
    Returns:
        str: Action à effectuer ("up", "down", "left", "right")
    """
    
    my_snake = game_data['my_snake']
    enemy_snake = game_data['enemy_snake']
    food = game_data['food']
    grid_size = game_data['grid_size']
    
    head = my_snake['head']
    current_direction = my_snake['direction']
    
    # Liste des actions possibles
    possible_actions = ['up', 'down', 'left', 'right']
    
    # Éviter de revenir sur soi-même
    opposites = {
        'up': 'down',
        'down': 'up', 
        'left': 'right',
        'right': 'left'
    }
    
    if opposites[current_direction] in possible_actions:
        possible_actions.remove(opposites[current_direction])
    
    # Calculer les positions suivantes pour chaque action
    next_positions = {}
    for action in possible_actions:
        next_pos = head.copy()
        
        if action == 'up':
            next_pos[0] -= 1
        elif action == 'down':
            next_pos[0] += 1
        elif action == 'left':
            next_pos[1] -= 1
        elif action == 'right':
            next_pos[1] += 1
            
        next_positions[action] = next_pos
    
    # Éliminer les actions qui mènent à une collision avec les murs
    safe_actions = []
    for action, pos in next_positions.items():
        if (0 <= pos[0] < grid_size['rows'] and 
            0 <= pos[1] < grid_size['cols']):
            safe_actions.append(action)
    
    # Éliminer les actions qui mènent à une collision avec les serpents
    all_snake_bodies = my_snake['body'] + enemy_snake['body']
    collision_free_actions = []
    
    for action in safe_actions:
        pos = next_positions[action]
        if pos not in all_snake_bodies:
            collision_free_actions.append(action)
    
    # Si aucune action sûre, choisir au hasard parmi les actions possibles
    if not collision_free_actions:
        collision_free_actions = safe_actions if safe_actions else possible_actions
    
    # Stratégie simple: aller vers la nourriture
    if collision_free_actions:
        best_action = collision_free_actions[0]
        min_distance = float('inf')
        
        for action in collision_free_actions:
            pos = next_positions[action]
            
            # Distance de Manhattan vers la nourriture
            distance = abs(pos[0] - food[0]) + abs(pos[1] - food[1])
            
            if distance < min_distance:
                min_distance = distance
                best_action = action
        
        return best_action
    
    # Dernier recours: continuer dans la direction actuelle
    return current_direction

def main():
    """
    Fonction principale qui lit l'état du jeu et retourne l'action.
    """
    try:
        # Lire l'état du jeu depuis stdin
        input_data = sys.stdin.read()
        game_data = json.loads(input_data)
        
        # Calculer la prochaine action
        action = get_next_action(game_data)
        
        # Retourner l'action au format JSON
        response = {"action": action}
        print(json.dumps(response))
        
    except Exception as e:
        # En cas d'erreur, retourner une action par défaut
        response = {"action": "up"}
        print(json.dumps(response))

if __name__ == "__main__":
    main() 