// Service alternatif utilisant un proxy local pour éviter les problèmes CORS
import axios from 'axios'

// Configuration pour utiliser le proxy local
const PROXY_API_URL = 'http://localhost:3001/api/its'
const USE_PROXY = false // Changer à true si vous avez des problèmes CORS

/**
 * Version alternative de generatePaymentToken utilisant un proxy local
 * @param {Object} paymentData - Données de paiement
 * @returns {Promise<string>} - Réponse XML du serveur
 */
export async function generatePaymentTokenViaProxy(paymentData) {
  if (!USE_PROXY) {
    throw new Error('Le proxy n\'est pas activé. Modifiez USE_PROXY dans proxyService.js')
  }
  
  try {
    // Générer le XML SOAP (même fonction que dans itsService.js)
    const soapXml = generateSoapXml(paymentData)
    
    const response = await axios({
      method: 'POST',
      url: PROXY_API_URL,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8'
      },
      data: soapXml,
      timeout: 30000
    })
    
    return response.data
    
  } catch (error) {
    console.error('Erreur via proxy:', error)
    throw error
  }
}

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