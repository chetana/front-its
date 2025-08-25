#!/bin/bash

echo "🚀 Démarrage de l'application Front-ITS"
echo "======================================"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
fi

echo "✅ Dépendances installées"
echo "🌐 Démarrage du serveur de développement..."
echo "📱 L'application sera accessible sur http://localhost:3000"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"
echo ""

# Démarrer l'application
npm run dev