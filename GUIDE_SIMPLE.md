# 🐍 Guide d'utilisation - Snake Arena Tournois

## Démarrage rapide

### 1. Lancer le serveur backend
```bash
cd backend
npm start
```

### 2. Lancer le frontend  
```bash
cd frontend  
npm start
```

### 3. Créer des données de test
```bash
cd backend
node scripts/createTestData.js
```

Cela créera 4 utilisateurs de test avec leurs scripts :
- alice@test.com / test123 (Script Glouton)
- bob@test.com / test123 (Script Aléatoire)  
- charlie@test.com / test123 (Script Défensif)
- diana@test.com / test123 (Script Glouton2)

## Comment ça marche

### 1. Créer un tournoi
- Va sur http://localhost:3000/tournaments
- Clique sur "Créer un tournoi"
- Donne un nom et choisis le nombre de participants

### 2. S'inscrire au tournoi
- Les joueurs visitent la page du tournoi
- Ils sélectionnent un de leurs scripts
- Ils cliquent "S'inscrire"

### 3. Démarrer le tournoi
- Quand il y a assez de participants (minimum 2)
- Clique sur "🚀 Démarrer le tournoi"
- Tous les matchs sont automatiquement exécutés

### 4. Voir les replays
- Une fois le tournoi terminé
- Clique sur "📺 Voir le replay" sur chaque match
- Tu peux contrôler la vitesse, faire pause, naviguer frame par frame

## Fonctionnalités

✅ **Tournois élimination directe uniquement**  
✅ **Inscription des vrais joueurs avec leurs scripts**  
✅ **Exécution automatique des matchs**  
✅ **Replays interactifs** avec le même rendu que le bac à sable  
✅ **Interface simple et claire**

## Structure des matchs

- **4 joueurs** → Demi-finales puis Finale
- **8 joueurs** → Quarts, Demi-finales, Finale  
- **16 joueurs** → Tour 1, Quarts, Demi-finales, Finale

Le système génère automatiquement le bracket d'élimination directe et exécute tous les matchs en séquence.

## C'est tout !

Le système est maintenant opérationnel. Tu peux créer des tournois, inviter des joueurs à s'inscrire, et voir les replays de tous les matchs avec la même interface que le bac à sable existant. 