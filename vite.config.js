import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/its': {
        target: 'https://itspgw.its-connect.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/its/, '/Service.svc'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying request to ITS:', req.method, req.url)
            // Assurer que les headers SOAP sont présents
            proxyReq.setHeader('Content-Type', 'text/xml; charset=utf-8')
            proxyReq.setHeader('SOAPAction', 'http://tempuri.org/IPaymentGateway/GeneratePaypageToken')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Response from ITS:', proxyRes.statusCode)
          })
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err)
          })
        }
      }
    }
  }
})