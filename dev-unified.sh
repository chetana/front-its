#!/bin/bash

echo "🚀 Démarrage de l'application Front-ITS (Mode Unifié)"
echo "===================================================="
echo ""
echo "ℹ️  Ce script lance un serveur unique avec:"
echo "   - Proxy ITS intégré"
echo "   - Interface Vue.js"
echo "   - Callbacks de paiement"
echo "   - WebSocket pour temps réel"
echo ""

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
echo ""

# Build du frontend pour le serveur unifié
echo "🔨 Construction du frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du frontend"
    exit 1
fi

echo "✅ Frontend construit"
echo ""
echo "🌐 Démarrage du serveur unifié..."
echo "📱 Application disponible sur : http://localhost:3001"
echo "❤️  Health Check : http://localhost:3001/api/health"
echo "🔗 Proxy ITS : http://localhost:3001/api/its"
echo ""
echo "💳 URLs de callback automatiques :"
echo "   - Succès: http://localhost:3001/payment/success"
echo "   - Erreur: http://localhost:3001/payment/error"
echo "   - Callback: http://localhost:3001/payment/callback"
echo "   - Post-failure: http://localhost:3001/payment/post-failure"
echo ""
echo "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Démarrer le serveur unifié
NODE_ENV=production npm run server:dev