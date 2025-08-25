#!/bin/bash

echo "🔍 Test de Résolution CORS"
echo "=========================="

# Vérifier que le serveur de dev n'est pas en cours
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 occupé - le serveur utilisera un autre port"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3001 occupé - le serveur utilisera un autre port"
fi

echo ""
echo "🚀 Démarrage du serveur de développement..."
echo "📋 Instructions :"
echo "   1. Attendez que le serveur démarre"
echo "   2. Ouvrez l'URL affichée dans votre navigateur"
echo "   3. Cliquez sur '🔍 Tester la Connectivité'"
echo "   4. Si succès, cliquez sur '🚀 Générer le Token'"
echo ""
echo "🛑 Pour arrêter : Ctrl+C"
echo ""

# Démarrer le serveur
npm run dev