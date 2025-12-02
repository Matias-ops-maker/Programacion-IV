#!/bin/bash

# Script de verificación de Docker Compose
# Verifica que Docker y Docker Compose estén instalados y que la configuración sea válida

set -e

echo "🐳 VERIFICACIÓN DE DOCKER COMPOSE"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Verificar que Docker esté instalado
echo "✓ Verificando instalación de Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instálalo desde: https://www.docker.com/"
    exit 1
fi
DOCKER_VERSION=$(docker --version)
echo "  ✅ Docker encontrado: $DOCKER_VERSION"
echo ""

# Verificar que Docker Compose esté instalado
echo "✓ Verificando instalación de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    exit 1
fi
COMPOSE_VERSION=$(docker-compose --version)
echo "  ✅ Docker Compose encontrado: $COMPOSE_VERSION"
echo ""

# Verificar que Docker Daemon esté corriendo
echo "✓ Verificando que Docker Daemon esté activo..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Daemon no está corriendo. Por favor, inicia Docker."
    exit 1
fi
echo "  ✅ Docker Daemon está activo"
echo ""

# Validar archivo docker-compose.yml
echo "✓ Validando configuración de docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml no encontrado en el directorio actual"
    exit 1
fi

if ! docker-compose config > /dev/null 2>&1; then
    echo "❌ docker-compose.yml tiene errores de sintaxis"
    docker-compose config
    exit 1
fi
echo "  ✅ docker-compose.yml es válido"
echo ""

# Verificar que los archivos necesarios existan
echo "✓ Verificando archivos necesarios..."

REQUIRED_FILES=(
    "backend/init.sql"
    "backend/Dockerfile"
    "backend/package.json"
    "frontend/Dockerfile"
    "frontend/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Archivo requerido no encontrado: $file"
        exit 1
    fi
    echo "  ✅ $file"
done
echo ""

# Verificar puertos disponibles
echo "✓ Verificando disponibilidad de puertos..."
REQUIRED_PORTS=(3306 5000 3000)
for port in "${REQUIRED_PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  Advertencia: Puerto $port ya está en uso"
    else
        echo "  ✅ Puerto $port disponible"
    fi
done
echo ""

echo "═════════════════════════════════════════════════════════════"
echo "✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE"
echo ""
echo "Próximos pasos:"
echo "1. Ejecutar: docker-compose up --build"
echo "2. En otra terminal, ejecutar: bash run-tests.sh"
echo ""
