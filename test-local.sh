#!/bin/bash

echo "🧪 Test local de l'application Front-ITS avant déploiement"
echo "========================================================"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build de l'application
echo "🔨 Construction de l'application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build de l'application"
    exit 1
fi

echo "✅ Build réussi !"

# Test du serveur en mode production
echo "🚀 Test du serveur en mode production..."
echo "📍 L'application sera accessible sur http://localhost:8080"
echo "🔍 Health check disponible sur http://localhost:8080/api/health"
echo ""
echo "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Démarrer le serveur en mode production
NODE_ENV=production PORT=8080 npm start