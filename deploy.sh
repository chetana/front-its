#!/bin/bash

# Configuration
PROJECT_ID="your-gcp-project-id"  # Remplacez par votre Project ID
REGION="europe-west1"
SERVICE_NAME="front-its-payment-gateway"

echo "🚀 Déploiement de l'application Front-ITS sur Cloud Run..."

# Vérifier que gcloud est installé et configuré
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que le projet est configuré
if [ "$PROJECT_ID" = "your-gcp-project-id" ]; then
    echo "❌ Veuillez modifier le PROJECT_ID dans ce script avec votre vrai Project ID GCP"
    exit 1
fi

# Définir le projet
gcloud config set project $PROJECT_ID

# Activer les APIs nécessaires
echo "📋 Activation des APIs nécessaires..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build et déploiement avec Cloud Build
echo "🔨 Construction et déploiement avec Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

# Obtenir l'URL du service déployé
echo "🌐 Récupération de l'URL du service..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Déploiement terminé !"
echo "🔗 Votre application Front-ITS est disponible à l'adresse : $SERVICE_URL"

# Optionnel : ouvrir dans le navigateur (sur macOS/Linux)
if command -v open &> /dev/null; then
    echo "🌍 Ouverture dans le navigateur..."
    open $SERVICE_URL
elif command -v xdg-open &> /dev/null; then
    echo "🌍 Ouverture dans le navigateur..."
    xdg-open $SERVICE_URL
fi