# 🚀 Guide de Démarrage Rapide - Front-ITS

## Installation et Lancement (2 minutes)

### 1. Installation des dépendances
```bash
cd /home/cyin/djust/front-its
npm install
```

### 2. Lancement de l'application
```bash
# Option 1: Script de démarrage
./start.sh

# Option 2: Commande npm
npm run dev
```

### 3. Accès à l'application
Ouvrez votre navigateur sur : **http://localhost:3000**

## Test Rapide

### 1. Test des fonctions de base
Ouvrez le fichier `test.html` dans votre navigateur pour tester les fonctions sans Vue.js :
```bash
# Depuis le dossier front-its
open test.html
# ou
firefox test.html
```

### 2. Test de l'application complète
1. Lancez l'application (`npm run dev`)
2. Remplissez le formulaire avec les valeurs par défaut
3. Cliquez sur "Générer le Token"
4. Vérifiez que l'iframe de paiement s'affiche

## Valeurs par Défaut

L'application est préconfigurée avec :
- **Montant** : 12000 (120.00 EUR)
- **Référence** : TEST-ORDER-006
- **Fournisseur** : djust_test
- **Pays** : FRA
- **Devise** : EUR

## Problèmes CORS ?

Si vous rencontrez des erreurs CORS :

### Solution 1: Proxy de développement
```bash
# Terminal 1: Lancer le proxy
npm run proxy

# Terminal 2: Modifier le service pour utiliser le proxy
# Dans src/services/itsService.js, changez l'URL vers:
# const ITS_API_URL = 'http://localhost:3001/api/its'
```

### Solution 2: Navigateur en mode développement
```bash
# Chrome (Linux)
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"

# Firefox: Installer l'extension CORS Everywhere
```

## Structure des Fichiers

```
front-its/
├── src/
│   ├── App.vue              # 🎨 Interface principale
│   ├── main.js              # 🚀 Point d'entrée
│   └── services/
│       └── itsService.js    # 🔧 Logique API ITS
├── test.html                # 🧪 Tests sans Vue.js
├── start.sh                 # 📜 Script de démarrage
└── README.md                # 📚 Documentation complète
```

## Workflow Typique

1. **Modifier les paramètres** dans le formulaire
2. **Cliquer sur "Générer le Token"**
3. **Vérifier les logs** de débogage
4. **Utiliser l'iframe** pour le paiement
5. **Cliquer sur "Nouvelle Transaction"** pour recommencer

## Débogage

### Logs dans l'application
- Section "Logs de Débogage" en bas de l'interface
- Console du navigateur (F12)

### Vérifications rapides
```javascript
// Dans la console du navigateur
console.log('Test de génération XML:', generateSoapXml({
  Amount: 1000,
  CountryCode: 'FRA',
  CurrencyCode: 'EUR',
  Reference: 'TEST-123',
  SupplierID: 'djust_test'
}))
```

## URLs Importantes

- **Application** : http://localhost:3000
- **API ITS** : https://itspgw.its-connect.net/Service.svc
- **Page de paiement** : https://ecommerce.its-connect.net/PayPage/Token/{SupplierID}/{Token}

## Commandes Utiles

```bash
# Développement
npm run dev          # Lancer en mode développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build

# Proxy (si problèmes CORS)
npm run proxy        # Lancer le serveur proxy

# Tests
open test.html       # Tests de base
```

## Support Rapide

### Erreur "Token non trouvé"
- Vérifiez la réponse XML dans les logs
- Testez avec `test.html` d'abord

### Erreur CORS
- Utilisez le proxy : `npm run proxy`
- Ou désactivez CORS dans le navigateur

### Erreur de connexion
- Vérifiez votre connexion internet
- Testez l'URL de l'API dans le navigateur

### Interface ne se charge pas
- Vérifiez que le port 3000 est libre
- Relancez avec `npm run dev`

## Prêt à Développer ! 🎉

Votre environnement est maintenant configuré. L'application devrait fonctionner immédiatement avec les paramètres par défaut.

Pour des informations détaillées, consultez `README.md` et `TECHNICAL.md`.