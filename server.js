// Serveur proxy simple pour éviter les problèmes CORS en développement
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration - allow requests from your frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'], // Vite dev server ports
  credentials: true
}))

// Middleware pour parser le body des requêtes
app.use(express.text({ type: 'text/xml' }))
app.use(express.json())

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

// Route proxy pour l'API ITS
app.use('/api/its', createProxyMiddleware({
  target: 'https://itspgw.its-connect.net',
  changeOrigin: true,
  pathRewrite: {
    '^/api/its': '/Service.svc'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to ITS:', {
      method: req.method,
      url: req.url,
      headers: req.headers
    })
    
    // Ajouter les headers SOAP nécessaires
    proxyReq.setHeader('Content-Type', 'text/xml; charset=utf-8')
    proxyReq.setHeader('SOAPAction', 'http://tempuri.org/IPaymentGateway/GeneratePaypageToken')
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Response from ITS:', {
      statusCode: proxyRes.statusCode,
      headers: proxyRes.headers
    })
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Proxy error', details: err.message })
  }
}))

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Front-ITS Payment Gateway Server running on port ${PORT}`)
  console.log(`📡 Proxying requests to ITS Payment Gateway`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Frontend should connect to: http://localhost:${PORT}/api/its`)
    console.log(`❤️  Health check available at: http://localhost:${PORT}/api/health`)
  }
})