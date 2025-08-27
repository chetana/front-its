<template>
  <div id="app">
    <header class="header">
      <h1>🏦 ITS Payment Gateway</h1>
      <p>Générateur de token de paiement et interface de paiement</p>
    </header>

    <main class="main-content">
      <!-- Formulaire de génération de token -->
      <div class="card" v-if="!paymentToken">
        <h2>📝 Génération du Token de Paiement</h2>
        
        <form @submit.prevent="generateToken" class="payment-form">
          <div class="form-group">
            <label for="amount">Montant (en centimes) :</label>
            <input 
              type="number" 
              id="amount" 
              v-model="formData.Amount" 
              required 
              min="1"
              class="form-input"
            />
            <small class="help-text">Exemple: 12000 = 120.00 EUR</small>
          </div>

          <div class="form-group">
            <label for="countryCode">Code Pays :</label>
            <input 
              type="text" 
              id="countryCode" 
              v-model="formData.CountryCode" 
              required 
              maxlength="3"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="currencyCode">Code Devise :</label>
            <input 
              type="text" 
              id="currencyCode" 
              v-model="formData.CurrencyCode" 
              required 
              maxlength="3"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="cv2avsControl">Contrôle CV2/AVS :</label>
            <select id="cv2avsControl" v-model="formData.CV2AVSControl" class="form-input">
              <option value="C">C - Contrôle CV2</option>
              <option value="A">A - Contrôle AVS</option>
              <option value="N">N - Aucun contrôle</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pageLanguage">Langue de la Page :</label>
            <select id="pageLanguage" v-model="formData.PageLanguage" class="form-input">
              <option value="FR">Français</option>
              <option value="EN">English</option>
              <option value="ES">Español</option>
              <option value="DE">Deutsch</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pageLocale">Locale de la Page :</label>
            <select id="pageLocale" v-model="formData.PageLocale" class="form-input">
              <option value="FR">FR</option>
              <option value="EN">EN</option>
              <option value="ES">ES</option>
              <option value="DE">DE</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reference">Référence de Commande :</label>
            <input 
              type="text" 
              id="reference" 
              v-model="formData.Reference" 
              required 
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="supplierId">ID Fournisseur :</label>
            <input 
              type="text" 
              id="supplierId" 
              v-model="formData.SupplierID" 
              required 
              class="form-input"
            />
          </div>

          <!-- URLs de redirection -->
          <div class="form-group">
            <label for="onCompletionURL">URL de Succès :</label>
            <input 
              type="url" 
              id="onCompletionURL" 
              v-model="formData.OnCompletionURL" 
              placeholder="https://votre-domaine.com/payment/success"
              class="form-input"
            />
            <small class="help-text">URL de redirection après un paiement réussi</small>
          </div>

          <div class="form-group">
            <label for="onErrorURL">URL d'Erreur :</label>
            <input 
              type="url" 
              id="onErrorURL" 
              v-model="formData.OnErrorURL" 
              placeholder="https://votre-domaine.com/payment/error"
              class="form-input"
            />
            <small class="help-text">URL de redirection en cas d'erreur de paiement</small>
          </div>

          <div class="form-group">
            <label for="postbackResultURL">URL de Callback :</label>
            <input 
              type="url" 
              id="postbackResultURL" 
              v-model="formData.PostbackResultURL" 
              placeholder="https://votre-domaine.com/payment/callback"
              class="form-input"
            />
            <small class="help-text">URL pour recevoir les notifications de résultat (webhook)</small>
          </div>



          <div class="button-group">
            <button 
              type="submit" 
              :disabled="loading" 
              class="submit-btn"
            >
              {{ loading ? '⏳ Génération en cours...' : '🚀 Générer le Token' }}
            </button>
            
            <button 
              type="button" 
              @click="runConnectivityTest" 
              :disabled="loading"
              class="test-btn"
            >
              🔍 Tester la Connectivité
            </button>
            
            <button 
              type="button" 
              @click="autoFillUrls" 
              :disabled="loading"
              class="auto-fill-btn"
            >
              🔗 Remplir URLs Auto
            </button>
          </div>
        </form>

        <!-- Affichage des erreurs -->
        <div v-if="error" class="error-message">
          <h3>❌ Erreur</h3>
          <p>{{ error }}</p>
        </div>
      </div>

      <!-- Affichage du token et iframe de paiement -->
      <div v-if="paymentToken" class="card">
        <h2>✅ Token Généré avec Succès</h2>
        
        <div class="token-info">
          <div class="info-item">
            <strong>Token:</strong> 
            <code class="token-code">{{ paymentToken }}</code>
          </div>
          <div class="info-item">
            <strong>Référence:</strong> {{ tokenResponse.Reference }}
          </div>
          <div class="info-item">
            <strong>Montant:</strong> {{ (tokenResponse.Amount / 100).toFixed(2) }} {{ tokenResponse.CurrencyCode }}
          </div>
          <div class="info-item">
            <strong>Description:</strong> {{ tokenResponse.ResultDescription }}
          </div>
        </div>

        <div class="payment-section">
          <h3>💳 Interface de Paiement</h3>
          <p>Utilisez l'interface ci-dessous pour effectuer le paiement :</p>
          
          <div class="iframe-container">
            <iframe 
              :src="paymentUrl" 
              width="100%" 
              height="600"
              frameborder="0"
              class="payment-iframe"
              title="Interface de paiement ITS"
            ></iframe>
          </div>
        </div>

        <button @click="resetForm" class="reset-btn">
          🔄 Nouvelle Transaction
        </button>
      </div>

      <!-- Logs de débogage -->
      <div v-if="debugLogs.length > 0" class="card debug-section">
        <h3>🔍 Logs de Débogage</h3>
        <div class="debug-logs">
          <div v-for="(log, index) in debugLogs" :key="index" class="debug-log">
            <span class="log-timestamp">{{ log.timestamp }}</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- Section des callbacks de paiement -->
      <div class="card callback-section">
        <div class="callback-header">
          <h3>📡 Callbacks de Paiement</h3>
          <div class="callback-controls">
            <button 
              @click="testCallbackEndpoint('success')" 
              class="test-callback-btn success"
              :disabled="loading"
            >
              ✅ Test Succès
            </button>
            <button 
              @click="testCallbackEndpoint('error')" 
              class="test-callback-btn error"
              :disabled="loading"
            >
              ❌ Test Erreur
            </button>
            <button 
              @click="testCallbackEndpoint('callback')" 
              class="test-callback-btn info"
              :disabled="loading"
            >
              🔔 Test Callback
            </button>
            <button 
              @click="clearCallbacks" 
              class="clear-callbacks-btn"
              :disabled="loading"
            >
              🗑️ Vider
            </button>
          </div>
        </div>

        <div v-if="paymentCallbacks.length === 0" class="no-callbacks">
          <p>🔇 Aucun callback reçu pour le moment</p>
          <small>Les callbacks apparaîtront ici en temps réel lorsque ITS contactera les URLs de redirection</small>
        </div>

        <div v-else class="callbacks-list">
          <div 
            v-for="callback in paymentCallbacks" 
            :key="callback.id" 
            :class="['callback-item', callback.statusColor]"
          >
            <div class="callback-header-item">
              <span class="callback-icon">{{ callback.statusIcon }}</span>
              <span class="callback-type">{{ callback.type.toUpperCase() }}</span>
              <span class="callback-time">{{ callback.displayTime }}</span>
              <span class="callback-method">{{ callback.method }}</span>
            </div>
            
            <div class="callback-url">
              <strong>URL:</strong> {{ callback.url }}
            </div>
            
            <div v-if="callback.hasData" class="callback-data">
              <div v-if="Object.keys(callback.query || {}).length > 0" class="callback-query">
                <strong>Query Parameters:</strong>
                <pre>{{ JSON.stringify(callback.query, null, 2) }}</pre>
              </div>
              
              <div v-if="Object.keys(callback.body || {}).length > 0" class="callback-body">
                <strong>Body:</strong>
                <pre>{{ JSON.stringify(callback.body, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="callback-meta">
              <small>
                IP: {{ callback.ip || 'N/A' }} | 
                User-Agent: {{ callback.headers['user-agent'] || 'N/A' }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { generatePaymentTokenWithFallback as generatePaymentToken, parseTokenResponse, testConnectivity } from './services/corsService'
import { validatePaymentData, buildPaymentUrl } from './services/itsService'
import { 
  initializeSocket, 
  onPaymentCallback, 
  onCallbacksCleared, 
  getPaymentUrls, 
  getPaymentCallbacks, 
  clearPaymentCallbacks, 
  testCallback, 
  formatCallback, 
  disconnectSocket 
} from './services/callbackService'

export default {
  name: 'App',
  setup() {
    // État réactif
    const loading = ref(false)
    const error = ref(null)
    const paymentToken = ref(null)
    const tokenResponse = ref(null)
    const debugLogs = ref([])
    const paymentCallbacks = ref([])

    // Données du formulaire avec valeurs par défaut
    const formData = ref({
      Amount: 12000,
      CountryCode: 'FRA',
      CurrencyCode: 'EUR',
      CV2AVSControl: 'C',
      PageLanguage: 'FR',
      PageLocale: 'FR',
      Reference: 'TEST-ORDER-006',
      SupplierID: 'djust_test',
      // URLs de redirection (optionnelles)
      OnCompletionURL: '',
      OnErrorURL: '',
      PostbackResultURL: ''
    })

    // URL de paiement calculée
    const paymentUrl = computed(() => {
      if (!paymentToken.value || !tokenResponse.value) return ''
      return `https://ecommerce.its-connect.net/PayPage/Token/${tokenResponse.value.SupplierID}/${paymentToken.value}`
    })

    // Fonction pour ajouter des logs
    const addLog = (level, message) => {
      debugLogs.value.push({
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
      })
    }

    // Fonction pour générer le token
    const generateToken = async () => {
      loading.value = true
      error.value = null
      
      try {
        addLog('INFO', 'Début de la génération du token...')
        addLog('INFO', '⏳ Cela peut prendre jusqu\'à 60 secondes...')
        addLog('DEBUG', `Données envoyées: ${JSON.stringify(formData.value, null, 2)}`)
        
        // Ajouter un indicateur de progression
        let progressInterval = setInterval(() => {
          addLog('DEBUG', '⏳ Requête en cours de traitement...')
        }, 10000) // Toutes les 10 secondes
        
        const response = await generatePaymentToken(formData.value)
        
        clearInterval(progressInterval)
        
        addLog('INFO', 'Réponse reçue du serveur ITS')
        addLog('DEBUG', `Réponse brute: ${response}`)
        
        const parsedResponse = parseTokenResponse(response)
        addLog('INFO', 'Réponse parsée avec succès')
        addLog('DEBUG', `Token extrait: ${parsedResponse.Token}`)
        
        tokenResponse.value = parsedResponse
        paymentToken.value = parsedResponse.Token
        
        addLog('SUCCESS', `Token généré: ${parsedResponse.Token}`)
        addLog('INFO', `URL de paiement: ${paymentUrl.value}`)
        
      } catch (err) {
        error.value = err.message
        addLog('ERROR', `Erreur lors de la génération: ${err.message}`)
        
        // Ajouter des conseils spécifiques selon le type d'erreur
        if (err.message.includes('timeout')) {
          addLog('INFO', '💡 Le serveur ITS peut être lent. Essayez de relancer.')
        } else if (err.message.includes('Network Error')) {
          addLog('INFO', '💡 Vérifiez votre connexion internet.')
        } else if (err.message.includes('CORS')) {
          addLog('INFO', '💡 Redémarrez le serveur avec: ./dev-simple.sh')
        }
        
        console.error('Erreur:', err)
      } finally {
        loading.value = false
      }
    }

    // Fonction pour tester la connectivité
    const runConnectivityTest = async () => {
      loading.value = true
      error.value = null
      
      try {
        addLog('INFO', 'Test de connectivité en cours...')
        const results = await testConnectivity()
        
        addLog('INFO', `Test serveur: ${results.health.status}`)
        addLog('DEBUG', `Serveur: ${results.health.message}`)
        
        addLog('INFO', `Test proxy: ${results.proxy.status}`)
        addLog('DEBUG', `Proxy: ${results.proxy.message}`)
        
        addLog('INFO', `Test direct: ${results.direct.status}`)
        addLog('DEBUG', `Direct: ${results.direct.message}`)
        
        if (results.recommendations.length > 0) {
          addLog('WARNING', 'Recommandations:')
          results.recommendations.forEach(rec => {
            addLog('WARNING', `- ${rec}`)
          })
        }
        
        if (results.proxy.status === 'success') {
          addLog('SUCCESS', '✅ Proxy Vite fonctionnel - Vous pouvez générer des tokens')
        } else if (results.direct.status === 'success') {
          addLog('SUCCESS', '✅ Connexion directe fonctionnelle')
        } else {
          addLog('ERROR', '❌ Aucune méthode de connexion disponible')
        }
        
      } catch (err) {
        addLog('ERROR', `Erreur lors du test: ${err.message}`)
      } finally {
        loading.value = false
      }
    }

    // Fonction pour réinitialiser le formulaire
    const resetForm = () => {
      paymentToken.value = null
      tokenResponse.value = null
      error.value = null
      debugLogs.value = []
      addLog('INFO', 'Formulaire réinitialisé')
    }

    // Fonction pour remplir automatiquement les URLs
    const autoFillUrls = async () => {
      try {
        addLog('INFO', 'Récupération des URLs automatiques...')
        const urlData = await getPaymentUrls()
        
        formData.value.OnCompletionURL = urlData.urls.OnCompletionURL
        formData.value.OnErrorURL = urlData.urls.OnErrorURL
        formData.value.PostbackResultURL = urlData.urls.PostbackResultURL
        
        addLog('SUCCESS', `URLs remplies automatiquement depuis ${urlData.baseUrl}`)
      } catch (err) {
        addLog('ERROR', `Erreur lors du remplissage automatique: ${err.message}`)
      }
    }

    // Fonction pour tester un endpoint de callback
    const testCallbackEndpoint = async (type) => {
      try {
        addLog('INFO', `Test du callback ${type}...`)
        const result = await testCallback(type, {
          testData: 'Test manuel depuis l\'interface',
          reference: formData.value.Reference,
          amount: formData.value.Amount
        })
        addLog('SUCCESS', `Test ${type} réussi: ${result.message}`)
      } catch (err) {
        addLog('ERROR', `Erreur test ${type}: ${err.message}`)
      }
    }

    // Fonction pour vider les callbacks
    const clearCallbacks = async () => {
      try {
        await clearPaymentCallbacks()
        paymentCallbacks.value = []
        addLog('INFO', 'Callbacks supprimés')
      } catch (err) {
        addLog('ERROR', `Erreur suppression callbacks: ${err.message}`)
      }
    }

    // Fonction pour charger les callbacks existants
    const loadCallbacks = async () => {
      try {
        const callbacks = await getPaymentCallbacks()
        paymentCallbacks.value = callbacks.map(formatCallback)
      } catch (err) {
        console.error('Erreur chargement callbacks:', err)
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      // Initialiser WebSocket
      initializeSocket()
      
      // Remplir automatiquement les URLs au démarrage
      try {
        const urlData = await getPaymentUrls()
        formData.value.OnCompletionURL = urlData.urls.OnCompletionURL
        formData.value.OnErrorURL = urlData.urls.OnErrorURL
        formData.value.PostbackResultURL = urlData.urls.PostbackResultURL
        addLog('INFO', `URLs de callback remplies automatiquement depuis ${urlData.baseUrl}`)
      } catch (err) {
        addLog('WARNING', `Impossible de récupérer les URLs automatiquement: ${err.message}`)
      }
      
      // Écouter les nouveaux callbacks
      onPaymentCallback((callback) => {
        const formattedCallback = formatCallback(callback)
        paymentCallbacks.value.unshift(formattedCallback)
        
        // Garder seulement les 20 derniers
        if (paymentCallbacks.value.length > 20) {
          paymentCallbacks.value = paymentCallbacks.value.slice(0, 20)
        }
        
        addLog('INFO', `Callback ${callback.type} reçu: ${callback.url}`)
      })
      
      // Écouter la suppression des callbacks
      onCallbacksCleared(() => {
        paymentCallbacks.value = []
      })
      
      // Charger les callbacks existants
      await loadCallbacks()
    })

    onUnmounted(() => {
      disconnectSocket()
    })

    return {
      formData,
      loading,
      error,
      paymentToken,
      tokenResponse,
      paymentUrl,
      debugLogs,
      paymentCallbacks,
      generateToken,
      runConnectivityTest,
      resetForm,
      autoFillUrls,
      testCallbackEndpoint,
      clearCallbacks
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
}

.header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.payment-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.help-text {
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}

.submit-btn {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-group {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.button-group .submit-btn {
  flex: 1;
  min-width: 200px;
}

.test-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex: 0 0 auto;
  min-width: 180px;
}

.test-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
}

.test-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.error-message h3 {
  margin-top: 0;
  color: #c33;
}

.token-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.token-code {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #495057;
}

.payment-section h3 {
  color: #333;
  margin-bottom: 1rem;
}

.iframe-container {
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
}

.payment-iframe {
  display: block;
  width: 100%;
  min-height: 600px;
}

.reset-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-btn:hover {
  background: #5a6268;
}

.debug-section {
  background: #f8f9fa;
  border-left: 4px solid #17a2b8;
}

.debug-logs {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.debug-log {
  display: flex;
  gap: 1rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
}

.log-timestamp {
  color: #6c757d;
  min-width: 80px;
}

.log-level {
  font-weight: bold;
  min-width: 60px;
}

.log-level.INFO {
  color: #17a2b8;
}

.log-level.DEBUG {
  color: #6c757d;
}

.log-level.SUCCESS {
  color: #28a745;
}

.log-level.ERROR {
  color: #dc3545;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

/* Styles pour le bouton de remplissage automatique */
.auto-fill-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.auto-fill-btn:hover:not(:disabled) {
  background: #218838;
}

.auto-fill-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Styles pour la section des callbacks */
.callback-section {
  background: #f8f9fa;
  border-left: 4px solid #28a745;
}

.callback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.callback-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.test-callback-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-callback-btn.success {
  background: #28a745;
  color: white;
}

.test-callback-btn.success:hover:not(:disabled) {
  background: #218838;
}

.test-callback-btn.error {
  background: #dc3545;
  color: white;
}

.test-callback-btn.error:hover:not(:disabled) {
  background: #c82333;
}

.test-callback-btn.info {
  background: #17a2b8;
  color: white;
}

.test-callback-btn.info:hover:not(:disabled) {
  background: #138496;
}

.clear-callbacks-btn {
  background: #6c757d;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.clear-callbacks-btn:hover:not(:disabled) {
  background: #5a6268;
}

.test-callback-btn:disabled,
.clear-callbacks-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-callbacks {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-callbacks p {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.no-callbacks small {
  font-size: 0.875rem;
}

.callbacks-list {
  max-height: 400px;
  overflow-y: auto;
}

.callback-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.callback-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.callback-item.success {
  border-left: 4px solid #28a745;
}

.callback-item.error {
  border-left: 4px solid #dc3545;
}

.callback-item.info {
  border-left: 4px solid #17a2b8;
}

.callback-item.warning {
  border-left: 4px solid #ffc107;
}

.callback-header-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.callback-icon {
  font-size: 1.2rem;
}

.callback-type {
  font-weight: bold;
  color: #333;
  min-width: 80px;
}

.callback-time {
  color: #6c757d;
  font-size: 0.875rem;
}

.callback-method {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.callback-url {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  word-break: break-all;
}

.callback-data {
  margin: 0.5rem 0;
}

.callback-query,
.callback-body {
  margin: 0.5rem 0;
}

.callback-data pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0.25rem 0;
}

.callback-meta {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  color: #6c757d;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .payment-form {
    grid-template-columns: 1fr;
  }
  
  .card {
    padding: 1rem;
  }
  
  .callback-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .callback-controls {
    justify-content: center;
  }
  
  .callback-header-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .test-callback-btn,
  .clear-callbacks-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>