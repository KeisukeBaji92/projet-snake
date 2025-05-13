#!/bin/bash

echo "⚙️ Vérification de Node.js..."
if ! command -v node &> /dev/null
then
    echo "❌ Node.js n'est pas installé. Installez-le ici : https://nodejs.org/"
    exit 1
fi

VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$VERSION" -lt 18 ]; then
    echo "❌ Node.js version trop ancienne. Installez la version 18 ou supérieure."
    exit 1
fi

echo "✅ Node.js OK."

echo "📦 Installation backend..."
cd backend || exit
npm install
cd ..

echo "📦 Installation frontend..."
cd frontend || exit
npm install

echo "🚀 Lancement du frontend..."
npm start
