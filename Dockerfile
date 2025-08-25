# Utiliser l'image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Construire l'application pour la production
RUN npm run build

# Exposer le port
EXPOSE 8080

# Définir la variable d'environnement PORT pour Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Commande pour démarrer l'application (proxy server + frontend)
CMD ["npm", "start"]