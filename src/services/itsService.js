import axios from 'axios'

// Configuration de l'API ITS
const ITS_API_URL = '/api/its' // Utilise le proxy Vite
const ITS_SOAP_ACTION = 'http://tempuri.org/IPaymentGateway/GeneratePaypageToken'

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
  const urlFields = ['OnCompletionURL', 'OnErrorURL', 'PostbackResultURL']
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