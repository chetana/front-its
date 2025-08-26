import axios from 'axios'

// Configuration de l'API ITS
const ITS_API_URL = '/api/its' // Utilise le proxy Vite
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
 * Parse la réponse XML SOAP pour extraire les données du token
 * @param {string} xmlResponse - Réponse XML du serveur
 * @returns {Object} - Objet contenant les données parsées
 */
export function parseTokenResponse(xmlResponse) {
  try {
    // Créer un parser DOM
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml')
    
    // Vérifier s'il y a des erreurs de parsing
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error(`Erreur de parsing XML: ${parserError.textContent}`)
    }
    
    // Extraire les données avec les namespaces appropriés
    const getElementValue = (tagName) => {
      // Essayer différents sélecteurs pour gérer les namespaces
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
    
    // Extraire toutes les données de la réponse
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
    
    // Vérifier que le token a été extrait
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
 * Génère un token de paiement via l'API ITS
 * @param {Object} paymentData - Données de paiement
 * @returns {Promise<string>} - Réponse XML du serveur
 */
export async function generatePaymentToken(paymentData) {
  try {
    // Valider les données d'entrée
    if (!paymentData || typeof paymentData !== 'object') {
      throw new Error('Données de paiement invalides')
    }
    
    const requiredFields = ['Amount', 'CountryCode', 'CurrencyCode', 'Reference', 'SupplierID']
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw new Error(`Le champ ${field} est requis`)
      }
    }
    
    // Générer le XML SOAP
    const soapXml = generateSoapXml(paymentData)
    console.log('SOAP XML généré:', soapXml)
    
    // Configuration de la requête
    const config = {
      method: 'POST',
      url: ITS_API_URL,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': ITS_SOAP_ACTION,
        // Ajouter des headers pour éviter les problèmes CORS
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      data: soapXml,
      timeout: 30000, // 30 secondes de timeout
      // Configuration pour gérer les erreurs CORS
      withCredentials: false
    }
    
    console.log('Configuration de la requête:', config)
    
    // Effectuer la requête
    const response = await axios(config)
    
    console.log('Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    })
    
    // Vérifier le statut de la réponse
    if (response.status !== 200) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Vérifier que nous avons bien reçu du XML
    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Réponse invalide du serveur (pas de données XML)')
    }
    
    return response.data
    
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error)
    
    // Gérer les différents types d'erreurs
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: Le serveur ITS ne répond pas dans les temps')
    } else if (error.response) {
      // Erreur HTTP avec réponse du serveur
      const status = error.response.status
      const statusText = error.response.statusText
      const data = error.response.data
      
      console.error('Erreur HTTP:', { status, statusText, data })
      
      if (status === 404) {
        throw new Error('Service ITS non trouvé (404). Vérifiez l\'URL de l\'API.')
      } else if (status === 500) {
        throw new Error('Erreur interne du serveur ITS (500). Vérifiez les données envoyées.')
      } else if (status >= 400 && status < 500) {
        throw new Error(`Erreur client (${status}): ${statusText}. Vérifiez les paramètres de la requête.`)
      } else {
        throw new Error(`Erreur serveur (${status}): ${statusText}`)
      }
    } else if (error.request) {
      // Erreur réseau (pas de réponse)
      console.error('Erreur réseau:', error.request)
      throw new Error('Erreur réseau: Impossible de contacter le serveur ITS. Vérifiez votre connexion internet.')
    } else {
      // Autre erreur
      throw new Error(`Erreur inattendue: ${error.message}`)
    }
  }
}

/**
 * Construit l'URL de paiement ITS
 * @param {string} supplierID - ID du fournisseur
 * @param {string} token - Token de paiement
 * @returns {string} - URL complète de paiement
 */
export function buildPaymentUrl(supplierID, token) {
  if (!supplierID || !token) {
    throw new Error('SupplierID et Token sont requis pour construire l\'URL de paiement')
  }
  
  return `https://ecommerce.its-connect.net/PayPage/Token/${supplierID}/${token}`
}

/**
 * Valide les données de paiement avant envoi
 * @param {Object} paymentData - Données à valider
 * @returns {Object} - Objet avec isValid et errors
 */
export function validatePaymentData(paymentData) {
  const errors = []
  
  if (!paymentData) {
    return { isValid: false, errors: ['Données de paiement manquantes'] }
  }
  
  // Validation du montant
  if (!paymentData.Amount || paymentData.Amount <= 0) {
    errors.push('Le montant doit être supérieur à 0')
  }
  
  // Validation des codes pays et devise
  if (!paymentData.CountryCode || paymentData.CountryCode.length !== 3) {
    errors.push('Le code pays doit contenir exactement 3 caractères')
  }
  
  if (!paymentData.CurrencyCode || paymentData.CurrencyCode.length !== 3) {
    errors.push('Le code devise doit contenir exactement 3 caractères')
  }
  
  // Validation de la référence
  if (!paymentData.Reference || paymentData.Reference.trim().length === 0) {
    errors.push('La référence de commande est requise')
  }
  
  // Validation du SupplierID
  if (!paymentData.SupplierID || paymentData.SupplierID.trim().length === 0) {
    errors.push('L\'ID fournisseur est requis')
  }
  
  // Validation des valeurs énumérées
  const validCV2AVSControls = ['C', 'A', 'N']
  if (paymentData.CV2AVSControl && !validCV2AVSControls.includes(paymentData.CV2AVSControl)) {
    errors.push('Contrôle CV2/AVS invalide (doit être C, A ou N)')
  }
  
  // Validation des URLs (optionnelles)
  const urlFields = ['OnCompletionURL', 'OnErrorURL', 'PostbackResultURL', 'PostFailure']
  urlFields.forEach(field => {
    if (paymentData[field] && paymentData[field].trim()) {
      try {
        new URL(paymentData[field])
      } catch (e) {
        errors.push(`${field} doit être une URL valide`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}