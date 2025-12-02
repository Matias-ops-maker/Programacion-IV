#!/usr/bin/env pwsh

# Script maestro para ejecutar todas las verificaciones (Windows)
# Coordina la ejecución de docker, tests y validaciones e2e

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogDir = Join-Path $RepoRoot "verification-logs"

# Crear directorio de logs
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     VERIFICACIÓN AUTOMÁTICA COMPLETA DE LA APLICACIÓN    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📅 Timestamp: $Timestamp" -ForegroundColor White
Write-Host "📂 Directorio de trabajo: $RepoRoot" -ForegroundColor White
Write-Host ""

# Función para imprimir secciones
function Print-Section {
    param([string]$Title)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "$Title" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# Función para imprimir resultados
function Print-Result {
    param([int]$Code, [string]$Message)
    
    if ($Code -eq 0) {
        Write-Host "✅ $Message" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
}

# Paso 1: Verificar Docker
Print-Section "PASO 1: Verificando Docker Compose"

$LogFile = Join-Path $LogDir "01-docker-verification-$Timestamp.log"

try {
    & powershell -Command {
        & "$RepoRoot\verify-docker.ps1"
    } *> $LogFile
    
    if ($LASTEXITCODE -eq 0) {
        Print-Result 0 "Docker Compose verificado correctamente"
        $DockerOk = 1
    }
    else {
        Print-Result 1 "Error en verificación de Docker"
        $DockerOk = 0
        Get-Content $LogFile | Select-Object -Last 20
    }
}
catch {
    Print-Result 1 "Error: $_"
    $DockerOk = 0
}

if ($DockerOk -eq 0) {
    Write-Host ""
    Write-Host "⚠️  Abortando: Docker no está correctamente configurado" -ForegroundColor Yellow
    exit 1
}

# Paso 2: Iniciar Docker Compose (si no está corriendo)
Print-Section "PASO 2: Iniciando servicios Docker"

$dockerRunning = docker-compose ps 2>$null | Select-String "Up"

if (-not $dockerRunning) {
    Write-Host "🐳 Iniciando Docker Compose en background..." -ForegroundColor Yellow
    docker-compose up -d --build 2>&1 | Tee-Object -FilePath "$LogDir/02-docker-up-$Timestamp.log"
    
    Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
else {
    Write-Host "✅ Servicios Docker ya están activos" -ForegroundColor Green
}

# Paso 3: Validación E2E
Print-Section "PASO 3: Validando End-to-End"

$LogFile = Join-Path $LogDir "03-e2e-validation-$Timestamp.log"

try {
    & "$RepoRoot\verify-e2e.ps1" *> $LogFile
    
    if ($LASTEXITCODE -eq 0) {
        Print-Result 0 "Validación E2E exitosa"
        $E2eOk = 1
    }
    else {
        Print-Result 1 "Falló validación E2E"
        $E2eOk = 0
        Get-Content $LogFile | Select-Object -Last 20
    }
}
catch {
    Print-Result 1 "Error: $_"
    $E2eOk = 0
}

# Paso 4: Ejecutar Tests de Seguridad
Print-Section "PASO 4: Ejecutando Tests de Seguridad"

$LogFile = Join-Path $LogDir "04-security-tests-$Timestamp.log"
Write-Host "🔒 Ejecutando suite de tests de seguridad..." -ForegroundColor Yellow
Write-Host "(Esto puede tomar algunos minutos)" -ForegroundColor Gray
Write-Host ""

try {
    & "$RepoRoot\run-security-tests.ps1" *> $LogFile
    
    if ($LASTEXITCODE -eq 0) {
        Print-Result 0 "Tests de seguridad pasaron"
        $TestsOk = 1
    }
    else {
        Print-Result 1 "Algunos tests de seguridad fallaron"
        $TestsOk = 0
        Get-Content $LogFile | Select-Object -Last 50
    }
}
catch {
    Print-Result 1 "Error: $_"
    $TestsOk = 0
}

# Paso 5: Resumen Final
Print-Section "RESUMEN FINAL"

Write-Host "📋 Estado de Verificaciones:" -ForegroundColor Yellow
Write-Host ""

Write-Host -NoNewline "  Docker Compose: "
if ($DockerOk -eq 1) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }

Write-Host -NoNewline "  End-to-End: "
if ($E2eOk -eq 1) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }

Write-Host -NoNewline "  Tests Seguridad: "
if ($TestsOk -eq 1) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }

Write-Host ""
Write-Host "📂 Logs guardados en: $LogDir" -ForegroundColor Yellow
Write-Host ""

# Determinar resultado final
if ($DockerOk -eq 1 -and $E2eOk -eq 1 -and $TestsOk -eq 1) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        ✅ TODAS LAS VERIFICACIONES PASARON ✅            ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║        ⚠️  ALGUNAS VERIFICACIONES FALLARON ⚠️             ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Revisar los logs en: $LogDir" -ForegroundColor White
    Write-Host "2. Corregir los problemas identificados" -ForegroundColor White
    Write-Host "3. Ejecutar nuevamente: .\verify-all.ps1" -ForegroundColor White
    exit 1
}
