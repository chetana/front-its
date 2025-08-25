import axios from 'axios'

// Configuration des URLs
const DIRECT_API_URL = 'https://itspgw.its-connect.net/Service.svc'
const PROXY_API_URL = '/api/its'
const ITS_SOAP_ACTION = 'http://tempuri.org/IPaymentGateway/GeneratePaypageToken'

/**
 * Génère le XML SOAP pour la requête de génération de token
 * @param {Object} paymentData - Données de paiement
 * @returns {string} - XML SOAP formaté
 */
function generateSoapXml(paymentData) {
  return `<?xml version="1.0" encoding="utf-8"?>
<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:its="http://schemas.datacontract.org/2004/07/ITS.PaymentGatewayDataContract">
    <x:Body>
        <tem:GeneratePaypageToken>
            <tem:objPaypageRequestResponse>
                <its:Amount>${paymentData.Amount}</its:Amount>
                <its:CountryCode>${paymentData.CountryCode}</its:CountryCode>
                <its:CurrencyCode>${paymentData.CurrencyCode}</its:CurrencyCode>
                <its:CV2AVSControl>${paymentData.CV2AVSControl}</its:CV2AVSControl>
                <its:PageLanguage>${paymentData.PageLanguage}</its:PageLanguage>
                <its:PageLocale>${paymentData.PageLocale}</its:PageLocale>
                <its:Reference>${paymentData.Reference}</its:Reference>
                <its:SupplierID>${paymentData.SupplierID}</its:SupplierID>
            </tem:objPaypageRequestResponse>
        </tem:GeneratePaypageToken>
    </x:Body>
</x:Envelope>`
}

/**
 * Tente un appel API avec gestion automatique du fallback
 * @param {Object} paymentData - Données de paiement
 * @returns {Promise<string>} - Réponse XML du serveur
 */
export async function generatePaymentTokenWithFallback(paymentData) {
  const soapXml = generateSoapXml(paymentData)
  
  // Configuration de base
  const baseConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': ITS_SOAP_ACTION,
      'Accept': '*/*',
      'Cache-Control': 'no-cache'
    },
    data: soapXml,
    timeout: 30000
  }

  // Méthode 1: Essayer avec le proxy Vite
  try {
    console.log('🔄 Tentative avec proxy Vite...')
    const response = await axios({
      ...baseConfig,
      url: PROXY_API_URL
    })
    
    console.log('✅ Succès avec proxy Vite')
    return response.data
    
  } catch (proxyError) {
    console.warn('⚠️ Échec avec proxy Vite:', proxyError.message)
    
    // Méthode 2: Essayer en direct (peut échouer à cause de CORS)
    try {
      console.log('🔄 Tentative en direct...')
      const response = await axios({
        ...baseConfig,
        url: DIRECT_API_URL,
        withCredentials: false
      })
      
      console.log('✅ Succès en direct')
      return response.data
      
    } catch (directError) {
      console.error('❌ Échec en direct:', directError.message)
      
      // Si c'est une erreur CORS, donner des instructions
      if (directError.message.includes('CORS') || 
          directError.message.includes('Access-Control-Allow-Origin') ||
          directError.code === 'ERR_NETWORK') {
        
        throw new Error(`
🚨 Erreur CORS détectée !

Solutions possibles :

1. 🔄 Redémarrer le serveur de développement :
   - Arrêtez le serveur (Ctrl+C)
   - Relancez avec: npm run dev

2. 🌐 Utiliser un navigateur en mode développement :
   - Chrome: google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
   - Firefox: Installer l'extension "CORS Everywhere"

3. 🔧 Vérifier la configuration du proxy dans vite.config.js

4. 🚀 Utiliser le serveur proxy séparé :
   - Terminal 1: npm run proxy
   - Terminal 2: npm run dev

Erreur technique: ${directError.message}
        `)
      }
      
      // Autre type d'erreur
      throw directError
    }
  }
}

/**
 * Parse la réponse XML SOAP pour extraire les données du token
 * @param {string} xmlResponse - Réponse XML du serveur
 * @returns {Object} - Objet contenant les données parsées
 */
export function parseTokenResponse(xmlResponse) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml')
    
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error(`Erreur de parsing XML: ${parserError.textContent}`)
    }
    
    const getElementValue = (tagName) => {
      const selectors = [
        `a\\:${tagName}`,
        `${tagName}`,
        `*[localName="${tagName}"]`
      ]
      
      for (const selector of selectors) {
        const element = xmlDoc.querySelector(selector)
        if (element) {
          return element.textContent.trim()
        }
      }
      return null
    }
    
    const responseData = {
      Amount: parseInt(getElementValue('Amount')) || 0,
      CountryCode: getElementValue('CountryCode') || '',
      CurrencyCode: getElementValue('CurrencyCode') || '',
      PageLanguage: getElementValue('PageLanguage') || '',
      PageLocale: getElementValue('PageLocale') || '',
      Reference: getElementValue('Reference') || '',
      ResultDescription: getElementValue('ResultDescription') || '',
      SupplierID: getElementValue('SupplierID') || '',
      Token: getElementValue('Token') || ''
    }
    
    if (!responseData.Token) {
      console.error('XML Response:', xmlResponse)
      throw new Error('Token non trouvé dans la réponse. Vérifiez la structure XML.')
    }
    
    return responseData
    
  } catch (error) {
    console.error('Erreur lors du parsing de la réponse XML:', error)
    console.error('XML Response:', xmlResponse)
    throw new Error(`Erreur lors du parsing de la réponse: ${error.message}`)
  }
}

/**
 * Test de connectivité pour diagnostiquer les problèmes
 * @returns {Promise<Object>} - Résultat du test
 */
export async function testConnectivity() {
  const results = {
    proxy: { status: 'unknown', message: '', time: 0 },
    direct: { status: 'unknown', message: '', time: 0 },
    recommendations: []
  }
  
  // Test du proxy
  try {
    const startTime = Date.now()
    await axios.get(PROXY_API_URL, { timeout: 5000 })
    results.proxy = {
      status: 'success',
      message: 'Proxy Vite accessible',
      time: Date.now() - startTime
    }
  } catch (error) {
    results.proxy = {
      status: 'error',
      message: error.message,
      time: 0
    }
  }
  
  // Test direct (probablement échouera à cause de CORS)
  try {
    const startTime = Date.now()
    await axios.get(DIRECT_API_URL, { timeout: 5000, withCredentials: false })
    results.direct = {
      status: 'success',
      message: 'API ITS accessible directement',
      time: Date.now() - startTime
    }
  } catch (error) {
    results.direct = {
      status: 'error',
      message: error.message,
      time: 0
    }
  }
  
  // Générer des recommandations
  if (results.proxy.status === 'error' && results.direct.status === 'error') {
    results.recommendations.push('Redémarrer le serveur de développement')
    results.recommendations.push('Vérifier la connexion internet')
    results.recommendations.push('Utiliser un navigateur en mode développement')
  } else if (results.proxy.status === 'error') {
    results.recommendations.push('Vérifier la configuration du proxy dans vite.config.js')
    results.recommendations.push('Redémarrer le serveur de développement')
  }
  
  return results
}