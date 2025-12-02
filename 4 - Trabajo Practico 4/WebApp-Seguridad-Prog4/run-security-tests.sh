#!/bin/bash

# Script para ejecutar todos los tests de seguridad
# Genera un reporte detallado de resultados

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
REPORT_FILE="$REPO_ROOT/TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

echo "🔒 EJECUTANDO SUITE DE TESTS DE SEGURIDAD"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "$BACKEND_DIR" ] || [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo "❌ Error: No se encontró el directorio backend o package.json"
    exit 1
fi

# Cambiar al directorio del backend
cd "$BACKEND_DIR"

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    npm install
    echo ""
fi

# Generar reporte
cat > "$REPORT_FILE" << 'EOF'
# 🔒 Reporte de Tests de Seguridad

**Generado:** $(date)

## 📊 Resumen Ejecutivo

Tests de seguridad ejecutados para validar la corrección de vulnerabilidades.

## 🧪 Tests Disponibles

| # | Test | Descripción |
|---|------|-------------|
| 1 | Brute Force | Verificar protección contra ataques de fuerza bruta |
| 2 | Command Injection | Validar prevención de inyección de comandos |
| 3 | CSRF Protection | Comprobar token CSRF en formularios |
| 4 | File Inclusion | Prevenir inclusión de archivos remotos/locales |
| 5 | File Upload | Validar subida segura de archivos |
| 6 | Insecure CAPTCHA | Verificar CAPTCHA seguro |
| 7 | SQL Injection | Prevenir inyección SQL |
| 8 | Blind SQL Injection | Prevenir inyección SQL ciega |

EOF

echo "📋 Ejecutando tests de seguridad..."
echo ""

# Ejecutar el script de tests
npm run test:security 2>&1 | tee -a "$REPORT_FILE"

# Capturar código de salida
TEST_EXIT_CODE=$?

echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "📄 Reporte guardado en: $REPORT_FILE"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ TODOS LOS TESTS PASARON EXITOSAMENTE"
    exit 0
else
    echo "⚠️  ALGUNOS TESTS FALLARON"
    echo "Revisa el reporte para más detalles"
    exit 1
fi
