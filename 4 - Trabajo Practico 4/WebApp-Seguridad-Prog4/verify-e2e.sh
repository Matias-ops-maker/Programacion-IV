#!/bin/bash

# Script para validación End-to-End
# Verifica que toda la aplicación funcione correctamente

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=2

echo "🚀 VALIDACIÓN END-TO-END DE LA APLICACIÓN"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Función para verificar salud de servicios
check_service_health() {
    local service=$1
    local port=$2
    local url=$3
    local retries=$HEALTH_CHECK_RETRIES
    
    echo "🔍 Esperando a que $service esté listo (puerto $port)..."
    
    while [ $retries -gt 0 ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "  ✅ $service está disponible"
            return 0
        fi
        
        retries=$((retries - 1))
        if [ $retries -gt 0 ]; then
            echo "  ⏳ Reintentando... ($retries intentos restantes)"
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    echo "  ❌ Timeout: $service no respondió después de $((HEALTH_CHECK_RETRIES * HEALTH_CHECK_DELAY))s"
    return 1
}

# Verificar que Docker Compose esté corriendo
echo "✓ Verificando estado de Docker Compose..."
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker Compose no está corriendo"
    echo "   Ejecuta primero: docker-compose up --build"
    exit 1
fi
echo "  ✅ Servicios de Docker están activos"
echo ""

# Verificar MySQL
echo "🔹 Validando Base de Datos (MySQL)..."
check_service_health "MySQL" "3306" "http://localhost:3306" || exit 1

# Verificar Backend API
echo ""
echo "🔹 Validando Backend API..."
check_service_health "Backend" "5000" "http://localhost:5000/health" || {
    echo "   Nota: El endpoint /health podría no existir. Intentando /api..."
    check_service_health "Backend" "5000" "http://localhost:5000/api" || exit 1
}

# Verificar Frontend
echo ""
echo "🔹 Validando Frontend..."
check_service_health "Frontend" "3000" "http://localhost:3000" || exit 1

echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""

# Realizar tests básicos de API
echo "🧪 Ejecutando pruebas básicas de API..."
echo ""

API_TESTS=(
    "GET:http://localhost:5000/api/products:Obtener lista de productos"
    "GET:http://localhost:5000/api/auth/captcha:Obtener CAPTCHA"
)

PASSED=0
FAILED=0

for test in "${API_TESTS[@]}"; do
    IFS=':' read -r METHOD URL DESC <<< "$test"
    
    echo "  ▶ $DESC"
    
    if curl -s -X "$METHOD" "$URL" -H "Content-Type: application/json" > /dev/null 2>&1; then
        echo "    ✅ Éxito"
        ((PASSED++))
    else
        echo "    ❌ Falló"
        ((FAILED++))
    fi
done

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Resultados: $PASSED pasaron, $FAILED fallaron"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ VALIDACIÓN E2E COMPLETADA EXITOSAMENTE"
    echo ""
    echo "La aplicación está funcionando correctamente:"
    echo "  • MySQL: http://localhost:3306"
    echo "  • Backend API: http://localhost:5000"
    echo "  • Frontend: http://localhost:3000"
    echo ""
    exit 0
else
    echo "⚠️  ALGUNOS TESTS FALLARON"
    echo "Verifica la configuración de los servicios"
    exit 1
fi
