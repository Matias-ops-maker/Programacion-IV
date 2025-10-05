#!/bin/bash

echo "🚀 Configurando Trabajo Práctico 2 - API de Pedidos"
echo "=================================================="

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "✅ Node.js versión: $(node --version)"
echo "✅ npm versión: $(npm --version)"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"
echo ""

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar TypeScript"
    exit 1
fi

echo "✅ Compilación exitosa"
echo ""

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Algunos tests fallaron"
    exit 1
fi

echo "✅ Todos los tests pasaron correctamente"
echo ""

echo "🎉 ¡Configuración completada exitosamente!"
echo ""
echo "📋 Comandos disponibles:"
echo "  npm run dev          - Ejecutar en modo desarrollo"
echo "  npm start            - Ejecutar en modo producción"
echo "  npm test             - Ejecutar todos los tests"
echo "  npm run test:watch   - Ejecutar tests en modo watch"
echo "  npm run demo         - Ejecutar demo de la API"
echo ""
echo "🚀 Para iniciar el servidor:"
echo "  npm run dev"
echo ""
echo "📖 Para ver la documentación completa:"
echo "  cat README.md"