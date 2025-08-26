import { io } from 'socket.io-client'
import axios from 'axios'

// Configuration du client WebSocket
let socket = null

/**
 * Initialise la connexion WebSocket
 * @param {string} serverUrl - URL du serveur (optionnel, détecté automatiquement)
 * @returns {Object} - Instance socket
 */
export function initializeSocket(serverUrl = null) {
  if (socket) {
    socket.disconnect()
  }
  
  // Utiliser la même origine que la page (tout sur le même port maintenant)
  const url = serverUrl || `${window.location.protocol}//${window.location.host}`
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    timeout: 5000
  })
  
  socket.on('connect', () => {
    console.log('🔌 Connecté au serveur WebSocket')
  })
  
  socket.on('disconnect', () => {
    console.log('🔌 Déconnecté du serveur WebSocket')
  })
  
  socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion WebSocket:', error)
  })
  
  return socket
}

/**
 * Écoute les callbacks de paiement en temps réel
 * @param {Function} callback - Fonction appelée lors de la réception d'un callback
 */
export function onPaymentCallback(callback) {
  if (!socket) {
    console.warn('⚠️ Socket non initialisé. Appelez initializeSocket() d\'abord.')
    return
  }
  
  socket.on('payment-callback', callback)
}

/**
 * Écoute l'événement de suppression des callbacks
 * @param {Function} callback - Fonction appelée lors de la suppression
 */
export function onCallbacksCleared(callback) {
  if (!socket) {
    console.warn('⚠️ Socket non initialisé. Appelez initializeSocket() d\'abord.')
    return
  }
  
  socket.on('callbacks-cleared', callback)
}

/**
 * Récupère les URLs de callback automatiques du serveur
 * @returns {Promise<Object>} - URLs de callback
 */
export async function getPaymentUrls() {
  try {
    const response = await axios.get('/api/payment-urls')
    return response.data
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des URLs:', error)
    throw new Error(`Impossible de récupérer les URLs de callback: ${error.message}`)
  }
}

/**
 * Récupère l'historique des callbacks
 * @returns {Promise<Array>} - Liste des callbacks
 */
export async function getPaymentCallbacks() {
  try {
    const response = await axios.get('/api/payment-callbacks')
    return response.data.callbacks || []
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des callbacks:', error)
    throw new Error(`Impossible de récupérer les callbacks: ${error.message}`)
  }
}

/**
 * Supprime tous les callbacks stockés
 * @returns {Promise<Object>} - Résultat de la suppression
 */
export async function clearPaymentCallbacks() {
  try {
    const response = await axios.delete('/api/payment-callbacks')
    return response.data
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des callbacks:', error)
    throw new Error(`Impossible de supprimer les callbacks: ${error.message}`)
  }
}

/**
 * Ferme la connexion WebSocket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('🔌 Connexion WebSocket fermée')
  }
}

/**
 * Teste un endpoint de callback manuellement
 * @param {string} type - Type de callback (success, error, callback, post-failure)
 * @param {Object} testData - Données de test à envoyer
 * @returns {Promise<Object>} - Réponse du serveur
 */
export async function testCallback(type, testData = {}) {
  const endpoints = {
    success: '/payment/success',
    error: '/payment/error',
    callback: '/payment/callback',
    'post-failure': '/payment/post-failure'
  }
  
  const endpoint = endpoints[type]
  if (!endpoint) {
    throw new Error(`Type de callback invalide: ${type}`)
  }
  
  try {
    const response = await axios.post(endpoint, {
      test: true,
      timestamp: new Date().toISOString(),
      ...testData
    })
    
    return response.data
  } catch (error) {
    console.error(`❌ Erreur lors du test du callback ${type}:`, error)
    throw new Error(`Test du callback ${type} échoué: ${error.message}`)
  }
}

/**
 * Formate un callback pour l'affichage
 * @param {Object} callback - Données du callback
 * @returns {Object} - Callback formaté
 */
export function formatCallback(callback) {
  return {
    ...callback,
    displayTime: new Date(callback.timestamp).toLocaleString('fr-FR'),
    statusIcon: getStatusIcon(callback.type),
    statusColor: getStatusColor(callback.type),
    hasData: Object.keys(callback.query || {}).length > 0 || Object.keys(callback.body || {}).length > 0
  }
}

/**
 * Obtient l'icône pour un type de callback
 * @param {string} type - Type de callback
 * @returns {string} - Icône emoji
 */
function getStatusIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    callback: '🔔',
    'post-failure': '⚠️'
  }
  return icons[type] || '📡'
}

/**
 * Obtient la couleur pour un type de callback
 * @param {string} type - Type de callback
 * @returns {string} - Classe CSS de couleur
 */
function getStatusColor(type) {
  const colors = {
    success: 'success',
    error: 'error',
    callback: 'info',
    'post-failure': 'warning'
  }
  return colors[type] || 'default'
}