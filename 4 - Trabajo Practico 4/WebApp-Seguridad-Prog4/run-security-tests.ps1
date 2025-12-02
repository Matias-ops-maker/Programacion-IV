#!/usr/bin/env pwsh

# Script para ejecutar todos los tests de seguridad (Windows)
# Genera un reporte detallado de resultados

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RepoRoot "backend"
$ReportFile = Join-Path $RepoRoot "TEST_REPORT_$(Get-Date -Format 'yyyyMMdd_HHmmss').md"

Write-Host ""
Write-Host "🔒 EJECUTANDO SUITE DE TESTS DE SEGURIDAD" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path $BackendDir) -or -not (Test-Path "$BackendDir/package.json")) {
    Write-Host "❌ Error: No se encontró el directorio backend o package.json" -ForegroundColor Red
    exit 1
}

# Cambiar al directorio del backend
Push-Location $BackendDir

# Verificar que las dependencias estén instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Generar reporte
$reportContent = @"
# 🔒 Reporte de Tests de Seguridad

**Generado:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

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

## 📋 Resultados

"@

$reportContent | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "📋 Ejecutando tests de seguridad..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar el script de tests
npm run test:security | Tee-Object -FilePath $ReportFile -Append

# Capturar código de salida
$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 Reporte guardado en: $ReportFile" -ForegroundColor Yellow
Write-Host ""

Pop-Location

if ($testExitCode -eq 0) {
    Write-Host "✅ TODOS LOS TESTS PASARON EXITOSAMENTE" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  ALGUNOS TESTS FALLARON" -ForegroundColor Yellow
    Write-Host "Revisa el reporte para más detalles" -ForegroundColor Yellow
    exit 1
}
