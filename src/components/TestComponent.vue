<template>
  <div class="test-component">
    <h3>🧪 Tests de l'API ITS</h3>
    
    <div class="test-section">
      <h4>Test de validation des données</h4>
      <button @click="testValidation" class="test-btn">
        Tester la validation
      </button>
      <div v-if="validationResult" class="test-result">
        <pre>{{ JSON.stringify(validationResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h4>Test de génération XML</h4>
      <button @click="testXmlGeneration" class="test-btn">
        Tester la génération XML
      </button>
      <div v-if="xmlResult" class="test-result">
        <pre>{{ xmlResult }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h4>Test de parsing XML</h4>
      <button @click="testXmlParsing" class="test-btn">
        Tester le parsing XML
      </button>
      <div v-if="parseResult" class="test-result">
        <pre>{{ JSON.stringify(parseResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { validatePaymentData, parseTokenResponse } from '../services/itsService'

export default {
  name: 'TestComponent',
  setup() {
    const validationResult = ref(null)
    const xmlResult = ref(null)
    const parseResult = ref(null)

    const testData = {
      Amount: 12000,
      CountryCode: 'FRA',
      CurrencyCode: 'EUR',
      CV2AVSControl: 'C',
      PageLanguage: 'FR',
      PageLocale: 'FR',
      Reference: 'TEST-ORDER-006',
      SupplierID: 'djust_test'
    }

    const sampleXmlResponse = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <GeneratePaypageTokenResponse xmlns="http://tempuri.org/">
            <GeneratePaypageTokenResult xmlns:a="http://schemas.datacontract.org/2004/07/ITS.PaymentGatewayDataContract" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
                <a:Amount>12000</a:Amount>
                <a:CountryCode>FRA</a:CountryCode>
                <a:CurrencyCode>EUR</a:CurrencyCode>
                <a:PageLanguage>FR</a:PageLanguage>
                <a:PageLocale>FR</a:PageLocale>
                <a:Reference>TEST-ORDER-006</a:Reference>
                <a:ResultDescription>Token generated Successfully</a:ResultDescription>
                <a:SupplierID>djust_test</a:SupplierID>
                <a:Token>250825145343281</a:Token>
            </GeneratePaypageTokenResult>
        </GeneratePaypageTokenResponse>
    </s:Body>
</s:Envelope>`

    const testValidation = () => {
      validationResult.value = validatePaymentData(testData)
    }

    const testXmlGeneration = () => {
      xmlResult.value = generateSoapXml(testData)
    }

    const testXmlParsing = () => {
      try {
        parseResult.value = parseTokenResponse(sampleXmlResponse)
      } catch (error) {
        parseResult.value = { error: error.message }
      }
    }

    const generateSoapXml = (paymentData) => {
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

    return {
      validationResult,
      xmlResult,
      parseResult,
      testValidation,
      testXmlGeneration,
      testXmlParsing
    }
  }
}
</script>

<style scoped>
.test-component {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.test-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.test-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.test-btn:hover {
  background: #0056b3;
}

.test-result {
  margin-top: 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.test-result pre {
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

h4 {
  margin-top: 0;
  color: #495057;
}
</style>