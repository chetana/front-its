// Serveur proxy simple pour éviter les problèmes CORS en développement
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// Configuration Vite en mode développement
const isProduction = process.env.NODE_ENV === 'production'
let vite = null

// Activer Vite middleware seulement si pas en production et si explicitement demandé
const useViteMiddleware = !isProduction && process.env.USE_VITE_MIDDLEWARE !== 'false'

if (!isProduction && useViteMiddleware) {
  // En développement, préparer Vite mais l'ajouter après les routes API
  console.log('🔧 Initializing Vite middleware...')
  try {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24678 // Port différent pour HMR
        }
      },
      appType: 'spa',
      root: process.cwd(),
      base: '/',
      logLevel: 'info'
    })
    console.log('✅ Vite middleware initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing Vite middleware:', error)
    console.log('🔄 Falling back to static file serving...')
    vite = null
  }
}

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true // Allow all origins in production (Cloud Run)
      : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST']
  }
})
const PORT = process.env.PORT || 3001

// Stockage en mémoire pour les callbacks de paiement
const paymentCallbacks = new Map()

// Fonction pour obtenir l'URL de base du serveur
function getBaseUrl(req) {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http'
  const host = req.get('host')
  return `${protocol}://${host}`
}

// CORS configuration - allow requests from your frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production (Cloud Run)
    : ['http://localhost:3001', 'http://127.0.0.1:3001'], // Notre serveur unique
  credentials: true
}))

// Configuration du proxy ITS (définie ici pour être utilisée plus bas)
const itsProxyOptions = {
  target: 'https://itspgw.its-connect.net',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api/its': '/Service.svc'
  },
  logLevel: 'debug',
  timeout: 30000, // 30 secondes suffisent puisque le service répond en 141ms
  proxyTimeout: 30000,
  selfHandleResponse: false, // Laisser le proxy gérer la réponse automatiquement
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying request to ITS:', {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      target: 'https://itspgw.its-connect.net/Service.svc',
      contentType: req.get('content-type'),
      contentLength: req.get('content-length')
    })
    
    // Logger le body de la requête si disponible
    if (req.body) {
      console.log('📋 Request body being sent to ITS:')
      console.log(req.body)
    }
    
    // Conserver les headers originaux et ajouter seulement ceux nécessaires
    if (!proxyReq.getHeader('Content-Type')) {
      proxyReq.setHeader('Content-Type', 'text/xml; charset=utf-8')
    }
    if (!proxyReq.getHeader('SOAPAction')) {
      proxyReq.setHeader('SOAPAction', 'http://tempuri.org/IPaymentGateway/GeneratePaypageToken')
    }
    
    console.log('📤 Final proxy headers:', {
      'Content-Type': proxyReq.getHeader('Content-Type'),
      'SOAPAction': proxyReq.getHeader('SOAPAction'),
      'Content-Length': proxyReq.getHeader('Content-Length'),
      'Host': proxyReq.getHeader('Host')
    })
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Response from ITS:', {
      statusCode: proxyRes.statusCode,
      statusMessage: proxyRes.statusMessage,
      contentType: proxyRes.headers['content-type'],
      contentLength: proxyRes.headers['content-length']
    })
    
    // Ajouter les headers CORS nécessaires
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, SOAPAction')
    
    // Ne pas intercepter le body pour éviter les problèmes de stream
    // Le logging détaillé peut être fait côté client si nécessaire
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    })
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Proxy error', 
        details: err.message,
        code: err.code,
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Gérer les requêtes OPTIONS pour CORS preflight AVANT le proxy
app.options('/api/its', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, SOAPAction')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 heures
  res.status(200).end()
})

// Appliquer le proxy ITS AVANT tout parsing de body
app.use('/api/its', createProxyMiddleware(itsProxyOptions))

// Middleware pour parser le body des requêtes (pour les autres routes seulement)
app.use((req, res, next) => {
  // Skip body parsing pour les routes proxy
  if (req.path.startsWith('/api/its')) {
    return next()
  }
  
  // Parser le body pour les autres routes
  express.text({ type: 'text/xml' })(req, res, () => {
    express.json()(req, res, () => {
      express.urlencoded({ extended: true })(req, res, next)
    })
  })
})

// Middleware de débogage pour voir toutes les requêtes
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.get('user-agent')?.substring(0, 50)}...`)
  next()
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id)
  })
})

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

// ========================================
// ENDPOINTS DE REDIRECTION PAYMENT ITS
// ========================================

// Fonction utilitaire pour enregistrer et diffuser un callback
function handlePaymentCallback(type, req, res) {
  const timestamp = new Date().toISOString()
  const baseUrl = getBaseUrl(req)
  
  // Extraire toutes les données reçues
  const callbackData = {
    id: Date.now().toString(),
    type,
    timestamp,
    method: req.method,
    url: req.originalUrl,
    baseUrl,
    query: req.query,
    body: req.body,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-real-ip': req.get('x-real-ip')
    },
    ip: req.ip || req.connection.remoteAddress
  }
  
  // Stocker le callback
  paymentCallbacks.set(callbackData.id, callbackData)
  
  // Garder seulement les 50 derniers callbacks
  if (paymentCallbacks.size > 50) {
    const firstKey = paymentCallbacks.keys().next().value
    paymentCallbacks.delete(firstKey)
  }
  
  // Diffuser en temps réel via WebSocket
  io.emit('payment-callback', callbackData)
  
  console.log(`💳 ${type.toUpperCase()} callback reçu:`, {
    method: req.method,
    query: req.query,
    body: req.body
  })
  
  return callbackData
}

// 1. Endpoint de succès de paiement
app.all('/payment/success', (req, res) => {
  const callbackData = handlePaymentCallback('success', req, res)
  
  res.status(200).json({
    status: 'success',
    message: 'Paiement réussi - Callback reçu',
    timestamp: callbackData.timestamp,
    data: callbackData
  })
})

// 2. Endpoint d'erreur de paiement
app.all('/payment/error', (req, res) => {
  const callbackData = handlePaymentCallback('error', req, res)
  
  res.status(200).json({
    status: 'error',
    message: 'Erreur de paiement - Callback reçu',
    timestamp: callbackData.timestamp,
    data: callbackData
  })
})

// 3. Endpoint de callback/webhook
app.all('/payment/callback', (req, res) => {
  const callbackData = handlePaymentCallback('callback', req, res)
  
  res.status(200).json({
    status: 'received',
    message: 'Callback webhook reçu',
    timestamp: callbackData.timestamp,
    data: callbackData
  })
})

// 4. Endpoint d'échec post-traitement
app.all('/payment/post-failure', (req, res) => {
  const callbackData = handlePaymentCallback('post-failure', req, res)
  
  res.status(200).json({
    status: 'post-failure',
    message: 'Échec post-traitement - Callback reçu',
    timestamp: callbackData.timestamp,
    data: callbackData
  })
})

// API pour récupérer les callbacks stockés
app.get('/api/payment-callbacks', (req, res) => {
  const callbacks = Array.from(paymentCallbacks.values()).reverse() // Plus récents en premier
  res.json({
    count: callbacks.length,
    callbacks
  })
})

// API pour obtenir les URLs de callback automatiques
app.get('/api/payment-urls', (req, res) => {
  const baseUrl = getBaseUrl(req)
  
  res.json({
    baseUrl,
    urls: {
      OnCompletionURL: `${baseUrl}/payment/success`,
      OnErrorURL: `${baseUrl}/payment/error`,
      PostbackResultURL: `${baseUrl}/payment/callback`
    }
  })
})

// API pour vider les callbacks (utile pour les tests)
app.delete('/api/payment-callbacks', (req, res) => {
  paymentCallbacks.clear()
  io.emit('callbacks-cleared')
  res.json({ message: 'Callbacks supprimés', count: 0 })
})

// Configuration du proxy déjà définie plus haut dans le fichier

// Proxy déjà configuré plus haut dans le fichier

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Ajouter Vite middleware en dernier (après toutes les routes API)
if (!isProduction && vite) {
  app.use(vite.ssrFixStacktrace)
  app.use(vite.middlewares)
  console.log('🔧 Vite middleware added to Express app')
} else if (!isProduction) {
  // Fallback: servir les fichiers statiques depuis le répertoire racine
  console.log('🔄 Serving static files from root directory')
  app.use(express.static(path.join(__dirname)))
  
  // Route catch-all pour SPA
  app.get('*', (req, res, next) => {
    // Ignorer les routes API
    if (req.path.startsWith('/api/') || req.path.startsWith('/payment/')) {
      return next()
    }
    
    console.log('📄 Serving index.html for:', req.path)
    res.sendFile(path.join(__dirname, 'index.html'))
  })
}

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

server.listen(PORT, () => {
  console.log(`🚀 Front-ITS Payment Gateway Server running on port ${PORT}`)
  console.log(`📡 Proxying requests to ITS Payment Gateway`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔌 WebSocket server enabled for real-time callbacks`)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 Frontend Vue.js available at: http://localhost:${PORT}/`)
    console.log(`🔗 ITS API proxy available at: http://localhost:${PORT}/api/its`)
    console.log(`❤️  Health check available at: http://localhost:${PORT}/api/health`)
    console.log(`💳 Payment callbacks available at:`)
    console.log(`   - Success: http://localhost:${PORT}/payment/success`)
    console.log(`   - Error: http://localhost:${PORT}/payment/error`)
    console.log(`   - Callback: http://localhost:${PORT}/payment/callback`)
    console.log(`   - Post-failure: http://localhost:${PORT}/payment/post-failure`)
  }
})