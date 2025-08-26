# ✅ Configuration Cloud Run - Front-ITS

## 📋 Résumé des fichiers ajoutés/modifiés

### Nouveaux fichiers créés :

1. **`Dockerfile`** - Configuration Docker pour Cloud Run
2. **`.dockerignore`** - Exclusions pour le build Docker
3. **`cloudbuild.yaml`** - Configuration Google Cloud Build
4. **`deploy.sh`** - Script de déploiement automatisé
5. **`.env.production`** - Variables d'environnement de production
6. **`.env.development`** - Variables d'environnement de développement
7. **`test-local.sh`** - Test en mode production local
8. **`dev-start.sh`** - Script de développement complet
9. **`clean.sh`** - Script de nettoyage
10. **`DEPLOYMENT.md`** - Guide de déploiement détaillé

### Fichiers modifiés :

1. **`package.json`** - Scripts de production et dépendances
2. **`server.js`** - Support des fichiers statiques en production
3. **`start.sh`** - Redirection vers le script de développement
4. **`README.md`** - Documentation mise à jour

## 🚀 Étapes pour déployer

### 1. Configuration initiale

```bash
# Modifier le PROJECT_ID dans deploy.sh
nano deploy.sh
# Remplacer "your-gcp-project-id" par votre vrai Project ID
```

### 2. Test local (recommandé)

```bash
# Tester l'application en mode production localement
./test-local.sh
```

### 3. Déploiement sur Cloud Run

```bash
# Déploiement automatique
./deploy.sh
```

## 🔧 Architecture de déploiement

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloud Build   │───▶│  Container Reg.  │───▶│   Cloud Run     │
│                 │    │                  │    │                 │
│ - Build Docker  │    │ - Store Image    │    │ - Run Container │
│ - Run Tests     │    │ - Version Tags   │    │ - Auto Scale    │
│ - Deploy        │    │                  │    │ - HTTPS         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📊 Configuration Cloud Run

- **Service** : `front-its-payment-gateway`
- **Région** : `europe-west1`
- **Port** : `8080`
- **Mémoire** : `512Mi`
- **CPU** : `1`
- **Instances max** : `10`
- **Accès** : Public (non authentifié)

## 🌐 URLs après déploiement

- **Application** : `https://front-its-payment-gateway-[hash]-ew.a.run.app/`
- **Health Check** : `https://front-its-payment-gateway-[hash]-ew.a.run.app/api/health`
- **ITS Proxy** : `https://front-its-payment-gateway-[hash]-ew.a.run.app/api/its`

## 🔍 Vérification du déploiement

```bash
# Vérifier le service
gcloud run services describe front-its-payment-gateway --region=europe-west1

# Voir les logs
gcloud run logs tail front-its-payment-gateway --region=europe-west1

# Tester l'endpoint de santé
curl https://your-service-url/api/health
```

## 🛠️ Commandes utiles

```bash
# Redéployer après modifications
./deploy.sh

# Voir les révisions
gcloud run revisions list --service=front-its-payment-gateway --region=europe-west1

# Supprimer le service (si nécessaire)
gcloud run services delete front-its-payment-gateway --region=europe-west1
```

## ⚠️ Points importants

1. **Coûts** : Cloud Run facture à l'usage (requêtes + temps CPU)
2. **Limites** : 15 minutes max par requête, 32 Go RAM max
3. **Cold Start** : Première requête peut être plus lente
4. **HTTPS** : Automatiquement activé par Cloud Run
5. **Domaine personnalisé** : Configurable via Cloud Run

## 🔐 Sécurité

- L'application est publique (pas d'authentification)
- CORS configuré pour accepter toutes les origines en production
- Variables d'environnement sécurisées via Cloud Run
- Communication HTTPS obligatoire

## 📈 Monitoring

- **Logs** : Disponibles dans Cloud Logging
- **Métriques** : CPU, mémoire, requêtes dans Cloud Monitoring
- **Alertes** : Configurables via Cloud Monitoring

---

✅ **Configuration terminée !** Votre application Front-ITS est prête pour le déploiement sur Google Cloud Run.