#!/bin/bash

echo "🧹 Nettoyage des fichiers de build Front-ITS"
echo "============================================="

# Supprimer le dossier dist
if [ -d "dist" ]; then
    echo "🗑️  Suppression du dossier dist..."
    rm -rf dist
    echo "✅ Dossier dist supprimé"
else
    echo "ℹ️  Aucun dossier dist à supprimer"
fi

# Supprimer node_modules (optionnel)
read -p "🤔 Voulez-vous aussi supprimer node_modules ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "node_modules" ]; then
        echo "🗑️  Suppression du dossier node_modules..."
        rm -rf node_modules
        echo "✅ Dossier node_modules supprimé"
        echo "📦 N'oubliez pas de relancer 'npm install' avant le prochain développement"
    else
        echo "ℹ️  Aucun dossier node_modules à supprimer"
    fi
fi

# Supprimer les logs
if ls *.log 1> /dev/null 2>&1; then
    echo "🗑️  Suppression des fichiers de log..."
    rm -f *.log
    echo "✅ Fichiers de log supprimés"
fi

echo "✨ Nettoyage terminé !"