#!/bin/bash

echo "🔍 Test de diagnostic du proxy ITS"
echo "=================================="
echo ""

# Démarrer le serveur en arrière-plan
echo "🚀 Démarrage du serveur..."
NODE_ENV=production USE_VITE_MIDDLEWARE=false node server.js &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 3

echo "✅ Serveur démarré (PID: $SERVER_PID)"
echo ""

# Test 1: Health check
echo "🏥 Test 1: Health check"
curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
echo ""
echo ""

# Test 2: Connectivité directe ITS
echo "🌐 Test 2: Connectivité directe vers ITS"
echo "Timeout: 10 secondes"
timeout 10s curl -s -I https://itspgw.its-connect.net/Service.svc | head -3
echo ""

# Test 3: Test proxy avec requête simple
echo "📡 Test 3: Proxy avec requête simple (timeout: 15s)"
timeout 15s curl -s -X POST http://localhost:3001/api/its \
  -H "Content-Type: text/xml" \
  -d "<test>simple</test>" \
  --max-time 15 | head -5
echo ""
echo ""

# Test 4: Test proxy avec vraie requête SOAP
echo "🧪 Test 4: Proxy avec requête SOAP complète (timeout: 30s)"
cat > /tmp/soap_request.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <x:Header />
  <x:Body>
    <tem:GeneratePaypageToken>
      <tem:request>
        <tem:MerchantId>TEST_MERCHANT</tem:MerchantId>
        <tem:Amount>1000</tem:Amount>
        <tem:Currency>TND</tem:Currency>
        <tem:OrderId>TEST_ORDER_123</tem:OrderId>
        <tem:SuccessUrl>http://localhost:3001/payment/success</tem:SuccessUrl>
        <tem:FailUrl>http://localhost:3001/payment/error</tem:FailUrl>
        <tem:CallbackUrl>http://localhost:3001/payment/callback</tem:CallbackUrl>
      </tem:request>
    </tem:GeneratePaypageToken>
  </x:Body>
</x:Envelope>
EOF

echo "📤 Envoi de la requête SOAP..."
timeout 30s curl -s -X POST http://localhost:3001/api/its \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: http://tempuri.org/IPaymentGateway/GeneratePaypageToken" \
  -d @/tmp/soap_request.xml \
  --max-time 30 \
  -w "\n⏱️  Temps de réponse: %{time_total}s\n📊 Code de statut: %{http_code}\n" | head -20

echo ""
echo "🛑 Arrêt du serveur..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "✅ Test terminé"