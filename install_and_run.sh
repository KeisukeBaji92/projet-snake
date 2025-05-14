#!/bin/bash

# ======================
# INSTALLATION SCRIPT POUR LE PROJET SNAKE
# ======================

# Couleurs pour plus de fun 😎
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ======================
# ÉTAPE 1 – Vérifier si Node.js est installé
# ======================
echo -e "${GREEN}📦 Vérification de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}🚨 Node.js n'est pas installé.${NC}"
    echo -n "❓ Voulez-vous l'installer maintenant ? (y/n) : "
    read -r reponse
    if [[ "$reponse" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}🚀 Installation de Node.js en cours...${NC}"

        OS=$(uname)
        if [[ "$OS" == "Linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OS" == "Darwin" ]]; then
            if ! command -v brew &> /dev/null; then
                echo -e "${RED}❌ Homebrew est requis pour installer Node.js sur macOS. Installez-le depuis https://brew.sh/${NC}"
                exit 1
            fi
            brew install node
        else
            echo -e "${RED}❌ Système non reconnu. Veuillez installer Node.js manuellement.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}⛔ Installation annulée. Le script ne peut pas continuer.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js est déjà installé.${NC}"
fi

# ======================
# ÉTAPE 2 – Installation des dépendances
# ======================
echo -e "${GREEN}📦 Installation des dépendances npm...${NC}"
cd frontend || exit 1
npm install

# ======================
# ÉTAPE 3 – Lancer le serveur React
# ======================
echo -e "${GREEN}🚀 Lancement du serveur frontend...${NC}"
# Lancer avec une pause pour que la fenêtre reste ouverte sur Windows
if [[ "$OS" == "MINGW"* || "$OS" == *"MSYS"* || "$OS" == *"CYGWIN"* ]]; then
    npm start
    echo -e "${GREEN}Appuyez sur une touche pour fermer...${NC}"
    read -n 1
else
    npm start
fi
