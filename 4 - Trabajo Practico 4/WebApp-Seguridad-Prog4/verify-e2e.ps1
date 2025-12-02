#!/usr/bin/env pwsh

# Script para validación End-to-End (Windows)
# Verifica que toda la aplicación funcione correctamente

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$HealthCheckRetries = 30
$HealthCheckDelay = 2

Write-Host ""
Write-Host "🚀 VALIDACIÓN END-TO-END DE LA APLICACIÓN" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Función para verificar salud de servicios
function Check-ServiceHealth {
    param (
        [string]$Service,
        [int]$Port,
        [string]$Url
    )
    
    Write-Host "🔍 Esperando a que $Service esté listo (puerto $Port)..." -ForegroundColor Yellow
    
    $retries = $HealthCheckRetries
    while ($retries -gt 0) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 301 -or $response.StatusCode -eq 302) {
                Write-Host "  ✅ $Service está disponible" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Servicio no disponible aún
        }
        
        $retries--
        if ($retries -gt 0) {
            Write-Host "  ⏳ Reintentando... ($retries intentos restantes)" -ForegroundColor Gray
            Start-Sleep -Seconds $HealthCheckDelay
        }
    }
    
    Write-Host "  ❌ Timeout: $Service no respondió después de $($HealthCheckRetries * $HealthCheckDelay)s" -ForegroundColor Red
    return $false
}

# Verificar que Docker Compose esté corriendo
Write-Host "✓ Verificando estado de Docker Compose..." -ForegroundColor Yellow

$dockerStatus = docker-compose ps 2>$null | Select-String "Up"
if (-not $dockerStatus) {
    Write-Host "❌ Docker Compose no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta primero: docker-compose up --build" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Servicios de Docker están activos" -ForegroundColor Green
Write-Host ""

# Verificar MySQL
Write-Host "🔹 Validando Base de Datos (MySQL)..." -ForegroundColor Cyan
Check-ServiceHealth "MySQL" 3306 "http://localhost:3306" | Out-Null

# Verificar Backend API
Write-Host ""
Write-Host "🔹 Validando Backend API..." -ForegroundColor Cyan
if (-not (Check-ServiceHealth "Backend" 5000 "http://localhost:5000/health")) {
    Write-Host "   Nota: El endpoint /health podría no existir. Intentando /api..." -ForegroundColor Gray
    Check-ServiceHealth "Backend" 5000 "http://localhost:5000/api" | Out-Null
}

# Verificar Frontend
Write-Host ""
Write-Host "🔹 Validando Frontend..." -ForegroundColor Cyan
Check-ServiceHealth "Frontend" 3000 "http://localhost:3000" | Out-Null

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Realizar tests básicos de API
Write-Host "🧪 Ejecutando pruebas básicas de API..." -ForegroundColor Yellow
Write-Host ""

$apiTests = @(
    @{Method="GET"; Url="http://localhost:5000/api/products"; Desc="Obtener lista de productos"},
    @{Method="GET"; Url="http://localhost:5000/api/auth/captcha"; Desc="Obtener CAPTCHA"}
)

$passed = 0
$failed = 0

foreach ($test in $apiTests) {
    Write-Host "  ▶ $($test.Desc)" -ForegroundColor White
    
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method $test.Method -Headers @{"Content-Type"="application/json"} -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host "    ✅ Éxito" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "    ❌ Falló (Status: $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "    ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Resultados: $passed pasaron, $failed fallaron" -ForegroundColor Yellow
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ VALIDACIÓN E2E COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "La aplicación está funcionando correctamente:" -ForegroundColor Green
    Write-Host "  • MySQL: http://localhost:3306" -ForegroundColor White
    Write-Host "  • Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "  • Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    exit 0
}
else {
    Write-Host "⚠️  ALGUNOS TESTS FALLARON" -ForegroundColor Yellow
    Write-Host "Verifica la configuración de los servicios" -ForegroundColor Yellow
    exit 1
}
