#!/bin/bash

# Script maestro para ejecutar todas las verificaciones
# Coordina la ejecución de docker, tests y validaciones e2e

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$REPO_ROOT/verification-logs"

# Crear directorio de logs
mkdir -p "$LOG_DIR"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     VERIFICACIÓN AUTOMÁTICA COMPLETA DE LA APLICACIÓN    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Timestamp: $TIMESTAMP"
echo "📂 Directorio de trabajo: $REPO_ROOT"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir secciones
print_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Paso 1: Verificar Docker
print_section "PASO 1: Verificando Docker Compose"

LOG_FILE="$LOG_DIR/01-docker-verification-$TIMESTAMP.log"
if bash "$REPO_ROOT/verify-docker.sh" > "$LOG_FILE" 2>&1; then
    print_result 0 "Docker Compose verificado correctamente"
    DOCKER_OK=1
else
    print_result 1 "Error en verificación de Docker"
    DOCKER_OK=0
    cat "$LOG_FILE"
fi

if [ $DOCKER_OK -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Abortando: Docker no está correctamente configurado${NC}"
    exit 1
fi

# Paso 2: Iniciar Docker Compose (si no está corriendo)
print_section "PASO 2: Iniciando servicios Docker"

if ! docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "🐳 Iniciando Docker Compose en background..."
    docker-compose up -d --build 2>&1 | tee -a "$LOG_DIR/02-docker-up-$TIMESTAMP.log"
    
    echo "⏳ Esperando a que los servicios estén listos..."
    sleep 5
else
    echo "✅ Servicios Docker ya están activos"
fi

# Paso 3: Validación E2E
print_section "PASO 3: Validando End-to-End"

LOG_FILE="$LOG_DIR/03-e2e-validation-$TIMESTAMP.log"
if timeout 120 bash "$REPO_ROOT/verify-e2e.sh" > "$LOG_FILE" 2>&1; then
    print_result 0 "Validación E2E exitosa"
    E2E_OK=1
else
    print_result 1 "Falló validación E2E"
    E2E_OK=0
    tail -20 "$LOG_FILE"
fi

# Paso 4: Ejecutar Tests de Seguridad
print_section "PASO 4: Ejecutando Tests de Seguridad"

LOG_FILE="$LOG_DIR/04-security-tests-$TIMESTAMP.log"
echo "🔒 Ejecutando suite de tests de seguridad..."
echo "(Esto puede tomar algunos minutos)"
echo ""

cd "$REPO_ROOT/backend"
if npm run test:security > "$LOG_FILE" 2>&1; then
    print_result 0 "Tests de seguridad pasaron"
    TESTS_OK=1
else
    print_result 1 "Algunos tests de seguridad fallaron"
    TESTS_OK=0
    # Mostrar resumen del fallo
    tail -50 "$LOG_FILE"
fi

# Paso 5: Resumen Final
print_section "RESUMEN FINAL"

echo "📋 Estado de Verificaciones:"
echo ""
echo -n "  Docker Compose: "
print_result $((1 - DOCKER_OK)) "" 
if [ $DOCKER_OK -eq 1 ]; then echo "✅"; else echo "❌"; fi

echo -n "  End-to-End: "
if [ $E2E_OK -eq 1 ]; then echo "✅"; else echo "❌"; fi

echo -n "  Tests Seguridad: "
if [ $TESTS_OK -eq 1 ]; then echo "✅"; else echo "❌"; fi

echo ""
echo "📂 Logs guardados en: $LOG_DIR"
echo ""

# Determinar resultado final
if [ $DOCKER_OK -eq 1 ] && [ $E2E_OK -eq 1 ] && [ $TESTS_OK -eq 1 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        ✅ TODAS LAS VERIFICACIONES PASARON ✅            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║        ⚠️  ALGUNAS VERIFICACIONES FALLARON ⚠️             ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Revisar los logs en: $LOG_DIR"
    echo "2. Corregir los problemas identificados"
    echo "3. Ejecutar nuevamente: bash verify-all.sh"
    exit 1
fi
