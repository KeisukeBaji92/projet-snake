# Projet Snake Arena 🐍

Un jeu Snake multijoueur en temps réel développé avec Node.js, React et MongoDB.

## 🚀 Installation automatique (RECOMMANDÉE)

### Pour les professeurs et testeurs

Nous avons créé des scripts d'installation automatique qui détectent votre système d'exploitation et installent tous les prérequis nécessaires.

#### Sur Windows
```powershell
# Ouvrir PowerShell en tant qu'administrateur et exécuter :
.\install.ps1
```

#### Sur Linux/Mac/WSL
```bash
# Rendre le script exécutable et l'exécuter :
chmod +x install.sh
./install.sh
```

### Options disponibles
- `--force` ou `-Force` : Force la réinstallation même si les composants existent
- `--skip-mongo` ou `-SkipMongo` : Ignore l'installation MongoDB (si vous utilisez MongoDB Atlas)
- `--help` ou `-Help` : Affiche l'aide

### Exemple avec options
```bash
# Linux/Mac
./install.sh --force --skip-mongo

# Windows
.\install.ps1 -Force -SkipMongo
```

## ⚡ Démarrage rapide

Après l'installation, utilisez les scripts de démarrage :

#### Sur Windows
```powershell
.\start-snake-arena.ps1
```

#### Sur Linux/Mac
```bash
chmod +x start-snake-arena.sh
./start-snake-arena.sh
```

## 🔧 Installation manuelle (si nécessaire)

### Prérequis
- Node.js (v18+)
- npm ou yarn
- MongoDB (local ou MongoDB Atlas)
- Git

### Étapes manuelles

```bash
git clone https://github.com/KeisukeBaji92/projet-snake.git
cd projet-snake

# Installation du backend
cd backend
npm install
cd ..

# Installation du frontend
cd frontend
npm install
cd ..

# Lancer le backend
cd backend
node server.js

# Dans un autre terminal, lancer le frontend
cd ../frontend
npm start
```

## 🌐 Accès à l'application

Une fois démarré, l'application sera accessible via :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **MongoDB** : localhost:27017

## 🐛 Dépannage

### Problèmes courants

1. **Port déjà utilisé** : Les scripts vérifient automatiquement si les ports sont libres
2. **MongoDB non démarré** : Les scripts tentent de démarrer MongoDB automatiquement
3. **Node.js manquant** : Les scripts d'installation installent Node.js automatiquement
4. **Permissions** : Sur Windows, exécutez PowerShell en tant qu'administrateur

### Support multi-OS

✅ **Windows 10/11** : Installation complète via PowerShell  
✅ **Ubuntu/Debian** : Installation via apt-get  
✅ **CentOS/RHEL** : Installation via yum  
✅ **macOS** : Installation via Homebrew  
✅ **WSL** : Support complet sous Windows  

## 📝 Notes pour les professeurs

- Les scripts d'installation sont conçus pour fonctionner sans intervention utilisateur
- Tous les prérequis sont installés automatiquement
- La détection d'OS est automatique
- Les services démarrent automatiquement dans le bon ordre
- Des messages d'erreur clairs guident en cas de problème
