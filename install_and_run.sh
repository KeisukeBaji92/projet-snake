#!/bin/bash

echo "=== Installation automatique du projet Snake ==="

# Vérification ou installation de Node.js (Windows nécessite manuel donc on affiche une notice ici)
if ! command -v node &> /dev/null
then
    echo "Node.js n'est pas installé. Veuillez l'installer manuellement depuis https://nodejs.org/"
    read -p "Appuyez sur Entrée une fois que Node.js est installé..."
else
    echo "Node.js est installé : $(node -v)"
fi

# Installation des dépendances frontend
echo "Installation des dépendances dans le dossier frontend..."
cd frontend || exit 1
npm install

# Vérifie si cross-env est installé
if ! npx cross-env --version &> /dev/null
then
    echo "Installation de cross-env pour compatibilité Windows..."
    npm install --save-dev cross-env
fi

# Lancement de l'application avec la bonne commande cross-env
echo "Démarrage de l'application React..."
npx cross-env NODE_OPTIONS=--openssl-legacy-provider npm start

# Pause à la fin du script pour éviter la fermeture immédiate
read -p 'Appuyez sur une touche pour quitter...'
