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
  // Construire les champs URL optionnels
  const urlFields = []
  
  if (paymentData.OnCompletionURL && paymentData.OnCompletionURL.trim()) {
    urlFields.push(`                <its:OnCompletionURL>${paymentData.OnCompletionURL}</its:OnCompletionURL>`)
  }
  
  if (paymentData.OnErrorURL && paymentData.OnErrorURL.trim()) {
    urlFields.push(`                <its:OnErrorURL>${paymentData.OnErrorURL}</its:OnErrorURL>`)
  }
  
  if (paymentData.PostbackResultURL && paymentData.PostbackResultURL.trim()) {
    urlFields.push(`                <its:PostbackResultURL>${paymentData.PostbackResultURL}</its:PostbackResultURL>`)
  }
  
  if (paymentData.PostFailure && paymentData.PostFailure.trim()) {
    urlFields.push(`                <its:PostFailure>${paymentData.PostFailure}</its:PostFailure>`)
  }
  
  const urlFieldsXml = urlFields.length > 0 ? '\n' + urlFields.join('\n') : ''

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
                <its:SupplierID>${paymentData.SupplierID}</its:SupplierID>${urlFieldsXml}
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
    timeout: 30000 // 30 secondes suffisent puisque ITS répond rapidement
  }

  // Méthode 1: Essayer avec le proxy Express
  try {
    console.log('🔄 Tentative avec proxy Express...')
    console.log('📤 URL utilisée:', PROXY_API_URL)
    console.log('📤 Données SOAP (premiers 200 chars):', soapXml.substring(0, 200) + '...')
    
    const response = await axios({
      ...baseConfig,
      url: PROXY_API_URL
    })
    
    console.log('✅ Succès avec proxy Express')
    console.log('📥 Réponse reçue (premiers 200 chars):', response.data.substring(0, 200) + '...')
    return response.data
    
  } catch (proxyError) {
    console.warn('⚠️ Échec avec proxy Express:', {
      message: proxyError.message,
      status: proxyError.response?.status,
      statusText: proxyError.response?.statusText,
      data: proxyError.response?.data
    })
    
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
      console.error('❌ Échec en direct:', {
        message: directError.message,
        code: directError.code,
        status: directError.response?.status
      })
      
      // Analyser le type d'erreur du proxy
      if (proxyError.response?.status === 500) {
        const errorData = proxyError.response.data
        throw new Error(`
🚨 Erreur du serveur proxy !

Détails de l'erreur :
- Code: ${errorData.code || 'Inconnu'}
- Message: ${errorData.details || proxyError.message}
- Timestamp: ${errorData.timestamp || 'N/A'}

Solutions possibles :

1. 🔄 Redémarrer le serveur :
   - Arrêtez le serveur (Ctrl+C)
   - Relancez avec: ./dev-vite.sh

2. 🌐 Vérifier la connectivité réseau :
   - Testez: curl -I https://itspgw.its-connect.net/Service.svc

3. 🔧 Vérifier les logs du serveur pour plus de détails

Erreur technique: ${proxyError.message}
        `)
      }
      
      // Si c'est une erreur CORS, donner des instructions
      if (directError.message.includes('CORS') || 
          directError.message.includes('Access-Control-Allow-Origin') ||
          directError.code === 'ERR_NETWORK') {
        
        throw new Error(`
🚨 Erreur CORS détectée !

Solutions possibles :

1. 🔄 Utiliser le serveur unifié (recommandé) :
   - Arrêtez tous les serveurs (Ctrl+C)
   - Lancez: ./dev-vite.sh

2. 🔄 Redémarrer le serveur de développement :
   - Arrêtez le serveur (Ctrl+C)
   - Relancez avec: npm run dev:full

3. 🌐 Utiliser un navigateur en mode développement :
   - Chrome: google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
   - Firefox: Installer l'extension "CORS Everywhere"

4. 🔧 Vérifier que le serveur proxy fonctionne :
   - Testez: curl http://localhost:3001/api/health

Erreur technique: ${directError.message}
        `)
      }
      
      // Autre type d'erreur
      throw new Error(`
🚨 Erreur de communication !

Erreur proxy: ${proxyError.message}
Erreur directe: ${directError.message}

Solutions :
1. Vérifiez votre connexion internet
2. Redémarrez le serveur avec: ./dev-vite.sh
3. Contactez l'administrateur si le problème persiste
      `)
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
    health: { status: 'unknown', message: '', time: 0 },
    recommendations: []
  }
  
  // Test du health check du serveur
  try {
    const startTime = Date.now()
    const response = await axios.get('/api/health', { timeout: 5000 })
    results.health = {
      status: 'success',
      message: `Serveur Express accessible (${response.data.environment})`,
      time: Date.now() - startTime
    }
  } catch (error) {
    results.health = {
      status: 'error',
      message: error.message,
      time: 0
    }
  }
  
  // Test du proxy ITS (avec une requête GET simple)
  try {
    const startTime = Date.now()
    // Utiliser une requête GET simple pour tester la connectivité du proxy
    await axios.get(PROXY_API_URL, { 
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accepter les erreurs 4xx mais pas 5xx
    })
    results.proxy = {
      status: 'success',
      message: 'Proxy Express accessible',
      time: Date.now() - startTime
    }
  } catch (error) {
    results.proxy = {
      status: 'error',
      message: `${error.message} (Status: ${error.response?.status || 'N/A'})`,
      time: 0
    }
  }
  
  // Test direct (probablement échouera à cause de CORS)
  try {
    const startTime = Date.now()
    await axios.get(DIRECT_API_URL, { 
      timeout: 5000, 
      withCredentials: false,
      validateStatus: (status) => status < 500
    })
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
  if (results.health.status === 'error') {
    results.recommendations.push('Le serveur Express n\'est pas démarré - Lancez: ./dev-vite.sh')
    results.recommendations.push('Vérifiez que le port 3001 n\'est pas utilisé par un autre processus')
  } else if (results.proxy.status === 'error' && results.direct.status === 'error') {
    results.recommendations.push('Problème de connectivité réseau - Vérifiez votre connexion internet')
    results.recommendations.push('Le serveur ITS pourrait être temporairement indisponible')
    results.recommendations.push('Redémarrer le serveur avec: ./dev-vite.sh')
  } else if (results.proxy.status === 'error') {
    results.recommendations.push('Problème avec le proxy Express - Vérifiez les logs du serveur')
    results.recommendations.push('Redémarrer le serveur avec: ./dev-vite.sh')
  } else if (results.proxy.status === 'success') {
    results.recommendations.push('✅ Proxy fonctionnel - Vous pouvez générer des tokens')
  }
  
  return results
}