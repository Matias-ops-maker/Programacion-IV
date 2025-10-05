@echo off
echo 🚀 Configurando Trabajo Práctico 2 - API de Pedidos
echo ==================================================

REM Verificar que Node.js esté instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js primero.
    exit /b 1
)

REM Verificar que npm esté instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado. Por favor instala npm primero.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js versión: %NODE_VERSION%
echo ✅ npm versión: %NPM_VERSION%
echo.

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente
echo.

REM Compilar TypeScript
echo 🔨 Compilando TypeScript...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Error al compilar TypeScript
    exit /b 1
)

echo ✅ Compilación exitosa
echo.

REM Ejecutar tests
echo 🧪 Ejecutando tests...
call npm test

if %errorlevel% neq 0 (
    echo ❌ Algunos tests fallaron
    exit /b 1
)

echo ✅ Todos los tests pasaron correctamente
echo.

echo 🎉 ¡Configuración completada exitosamente!
echo.
echo 📋 Comandos disponibles:
echo   npm run dev          - Ejecutar en modo desarrollo
echo   npm start            - Ejecutar en modo producción  
echo   npm test             - Ejecutar todos los tests
echo   npm run test:watch   - Ejecutar tests en modo watch
echo   npm run demo         - Ejecutar demo de la API
echo.
echo 🚀 Para iniciar el servidor:
echo   npm run dev
echo.
echo 📖 Para ver la documentación completa:
echo   type README.md

pause