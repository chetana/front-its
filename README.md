# Front-ITS Payment Gateway

Application Vue.js pour l'intégration avec la passerelle de paiement ITS.

## 🚀 Démarrage rapide

### Option 1: Serveur unifié avec Vite intégré (Recommandé)
```bash
./dev-vite.sh
```
- Un seul serveur sur le port 3001
- Hot Module Replacement activé
- Proxy ITS intégré
- Callbacks de paiement en temps réel

### Option 2: Serveur unifié avec frontend pré-construit
```bash
./dev-unified.sh
```
- Un seul serveur sur le port 3001
- Frontend pré-construit (plus rapide)
- Proxy ITS intégré
- Callbacks de paiement en temps réel

### Option 3: Développement séparé (2 serveurs)
```bash
npm run dev:full
```
- Serveur Vite sur le port 3000
- Serveur Express sur le port 3001
- Nécessite les deux serveurs

## 🔧 Scripts disponibles

- `npm run dev` - Serveur Vite uniquement (port 3000)
- `npm run server` - Serveur Express uniquement (port 3001)
- `npm run server:dev` - Serveur Express avec nodemon
- `npm run dev:full` - Les deux serveurs en parallèle
- `npm run build` - Construction du frontend
- `npm run preview` - Aperçu de la version construite

## 🌐 URLs importantes

Quand le serveur fonctionne sur le port 3001 :

- **Application** : http://localhost:3001/
- **Health Check** : http://localhost:3001/api/health
- **Proxy ITS** : http://localhost:3001/api/its
- **Callbacks de paiement** :
  - Succès : http://localhost:3001/payment/success
  - Erreur : http://localhost:3001/payment/error
  - Callback : http://localhost:3001/payment/callback
  - Post-failure : http://localhost:3001/payment/post-failure

## 🔍 Résolution des problèmes

### Erreur CORS lors de la génération de token

1. **Vérifiez que le serveur fonctionne** :
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Redémarrez avec le serveur unifié** :
   ```bash
   # Arrêtez tous les serveurs (Ctrl+C)
   ./dev-vite.sh
   ```

3. **Testez la connectivité** :
   - Utilisez le bouton "Test de Connectivité" dans l'interface
   - Vérifiez les logs dans la console du navigateur

### Le bouton "Générer le token" ne fonctionne pas

1. **Vérifiez les logs du serveur** dans le terminal
2. **Ouvrez la console du navigateur** (F12) pour voir les erreurs
3. **Testez la connectivité** avec le bouton dédié
4. **Redémarrez le serveur** :
   ```bash
   ./dev-simple.sh
   ```

### ⏳ Timeout lors de la génération de token

Le serveur ITS peut prendre jusqu'à **60 secondes** pour répondre :

1. **Soyez patient** - L'interface affiche des messages de progression
2. **Ne fermez pas la page** pendant la génération
3. **Vérifiez les logs** dans l'interface pour voir l'état de la requête
4. **Si timeout persistant** :
   ```bash
   # Testez la connectivité directe
   curl -I https://itspgw.its-connect.net/Service.svc
   
   # Redémarrez le serveur
   ./dev-simple.sh
   ```

### Port déjà utilisé

Si le port 3001 est occupé :
```bash
# Trouver le processus
lsof -i :3001

# Tuer le processus
kill -9 <PID>

# Ou changer le port
PORT=3002 npm run server:dev
```

## 📋 Fonctionnalités

- ✅ Génération de tokens de paiement ITS
- ✅ Interface utilisateur intuitive
- ✅ Gestion automatique des erreurs CORS
- ✅ Callbacks de paiement en temps réel
- ✅ Logs de débogage détaillés
- ✅ Test de connectivité intégré
- ✅ Remplissage automatique des URLs
- ✅ WebSocket pour les notifications temps réel

## 🛠️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express        │    │   ITS Payment   │
│   Vue.js        │◄──►│   Proxy Server   │◄──►│   Gateway       │
│   (Port 3000)   │    │   (Port 3001)    │    │   (HTTPS)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   WebSocket      │
                       │   Callbacks      │
                       └──────────────────┘
```

## 📝 Notes de développement

- Le proxy Express gère les problèmes CORS avec l'API ITS
- Les callbacks de paiement sont stockés en mémoire et diffusés via WebSocket
- Le serveur peut fonctionner avec ou sans Vite middleware
- Les logs détaillés aident au débogage des problèmes de connectivité