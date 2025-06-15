# 🎓 Guide d'Installation pour Professeurs - Snake Arena

Ce guide détaillé vous permettra d'installer et de tester Snake Arena sur n'importe quelle machine en quelques minutes.

## 📋 Table des matières
1. [Téléchargement du projet](#téléchargement)
2. [Installation automatique](#installation-automatique)
3. [Démarrage de l'application](#démarrage)
4. [Test de l'application](#test)
5. [Dépannage](#dépannage)

## 📥 Téléchargement du projet {#téléchargement}

### Option 1 : Via Git (recommandé)
```bash
git clone https://github.com/KeisukeBaji92/projet-snake.git
cd projet-snake
```

### Option 2 : Téléchargement ZIP
1. Aller sur GitHub : https://github.com/KeisukeBaji92/projet-snake
2. Cliquer sur "Code" > "Download ZIP"
3. Extraire le fichier ZIP
4. Ouvrir un terminal dans le dossier extrait

## 🚀 Installation automatique {#installation-automatique}

### Sur Windows

1. **Ouvrir PowerShell en tant qu'administrateur**
   - Clic droit sur le menu Démarrer
   - Sélectionner "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Naviguer vers le dossier du projet**
   ```powershell
   cd C:\chemin\vers\projet-snake
   ```

3. **Exécuter le script d'installation**
   ```powershell
   .\install.ps1
   ```

4. **Si erreur d'exécution de script**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\install.ps1
   ```

### Sur Linux/Mac

1. **Ouvrir un terminal**

2. **Naviguer vers le dossier du projet**
   ```bash
   cd /chemin/vers/projet-snake
   ```

3. **Rendre le script exécutable et l'exécuter**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

## ⚡ Démarrage de l'application {#démarrage}

### Sur Windows
```powershell
.\start-snake-arena.ps1
```

### Sur Linux/Mac
```bash
chmod +x start-snake-arena.sh
./start-snake-arena.sh
```

## ✅ Messages attendus lors du démarrage

```
🐍 DÉMARRAGE DE SNAKE ARENA 🐍
============================================================

ℹ️  Vérification de MongoDB...
✅ MongoDB est déjà en cours d'exécution sur le port 27017

ℹ️  Démarrage du backend...
✅ Backend démarré avec succès

ℹ️  Démarrage du frontend...
ℹ️  Le frontend va s'ouvrir dans votre navigateur...
✅ Frontend démarré avec succès

✅ Snake Arena est prêt !
ℹ️  Frontend: http://localhost:3000
ℹ️  Backend: http://localhost:5000
ℹ️  MongoDB: localhost:27017
```

## 🧪 Test de l'application {#test}

### 1. Vérification des URLs

Ouvrir votre navigateur et tester ces URLs :

- **Frontend** : http://localhost:3000
  - ✅ Doit afficher l'interface du jeu Snake
  - ✅ Doit pouvoir créer un compte
  - ✅ Doit pouvoir se connecter

- **Backend** : http://localhost:5000
  - ✅ Doit afficher un message JSON ou la documentation API

### 2. Test fonctionnel

1. **Inscription** : Créer un nouveau compte
2. **Connexion** : Se connecter avec le compte créé
3. **Jeu** : Lancer une partie de Snake
4. **Multijoueur** : Tester avec plusieurs onglets

### 3. Tests automatiques

Le projet inclut des scripts de test :

```bash
# Test d'inscription simple
node test-inscription-simple.js

# Test d'inscription avec debug
node test-inscription-debug.js
```

## 🐛 Dépannage {#dépannage}

### Problème : "npm n'est pas reconnu"

**Solution** :
```powershell
# Windows - Réinstaller Node.js
.\install.ps1 -Force
```

```bash
# Linux/Mac - Réinstaller Node.js
./install.sh --force
```

### Problème : "Port 3000 déjà utilisé"

**Solution** :
1. Fermer les applications utilisant le port 3000
2. Ou utiliser un autre port :
   ```bash
   cd frontend
   PORT=3001 npm start
   ```

### Problème : "MongoDB ne démarre pas"

**Solutions** :
1. **Utiliser MongoDB Atlas** (recommandé pour les tests) :
   ```powershell
   .\install.ps1 -SkipMongo
   ```

2. **Installer MongoDB manuellement** :
   - Windows : https://www.mongodb.com/try/download/community
   - Linux : `sudo apt install mongodb`
   - Mac : `brew install mongodb/brew/mongodb-community`

### Problème : "Permission denied" sur Linux/Mac

**Solution** :
```bash
chmod +x *.sh
sudo ./install.sh
```

### Problème : Scripts PowerShell bloqués sur Windows

**Solution** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

## 📊 Vérification de l'installation

### Commandes de vérification

```bash
# Vérifier Node.js
node --version
# Doit afficher : v18.x.x ou plus récent

# Vérifier npm
npm --version
# Doit afficher : 8.x.x ou plus récent

# Vérifier MongoDB (si installé localement)
mongod --version
# Doit afficher : db version vX.x.x
```

### Ports utilisés

- **3000** : Frontend React
- **5000** : Backend Node.js/Express
- **27017** : MongoDB

## 📞 Support

Si vous rencontrez des problèmes :

1. **Logs détaillés** : Les scripts affichent des messages d'erreur explicites
2. **GitHub Issues** : Créer une issue sur le repository
3. **Scripts de debug** : Utiliser `test-inscription-debug.js` pour diagnostiquer

## 🎯 Résumé pour évaluation rapide

Pour une évaluation rapide du projet :

1. **Installation** (2-3 minutes) :
   ```bash
   ./install.sh    # ou .\install.ps1 sur Windows
   ```

2. **Démarrage** (30 secondes) :
   ```bash
   ./start-snake-arena.sh    # ou .\start-snake-arena.ps1 sur Windows
   ```

3. **Test** (1 minute) :
   - Ouvrir http://localhost:3000
   - Créer un compte et jouer

**Total : 4-5 minutes maximum** ⏱️ 