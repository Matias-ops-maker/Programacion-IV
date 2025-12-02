#!/usr/bin/env pwsh

# Script de verificación de Docker Compose para Windows
# Verifica que Docker y Docker Compose estén instalados y que la configuración sea válida

Write-Host ""
Write-Host "🐳 VERIFICACIÓN DE DOCKER COMPOSE" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté instalado
Write-Host "✓ Verificando instalación de Docker..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "  ✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Docker no está instalado. Por favor, instálalo desde: https://www.docker.com/" -ForegroundColor Red
    exit 1
}

# Verificar que Docker Compose esté instalado
Write-Host "✓ Verificando instalación de Docker Compose..." -ForegroundColor Yellow

try {
    $composeVersion = docker-compose --version
    Write-Host "  ✅ Docker Compose encontrado: $composeVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Docker Compose no está instalado." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar que Docker Daemon esté corriendo
Write-Host "✓ Verificando que Docker Daemon esté activo..." -ForegroundColor Yellow

try {
    $null = docker info
    Write-Host "  ✅ Docker Daemon está activo" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Docker Daemon no está corriendo. Por favor, inicia Docker." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Validar archivo docker-compose.yml
Write-Host "✓ Validando configuración de docker-compose.yml..." -ForegroundColor Yellow

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "  ❌ docker-compose.yml no encontrado en el directorio actual" -ForegroundColor Red
    exit 1
}

try {
    $null = docker-compose config
    Write-Host "  ✅ docker-compose.yml es válido" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ docker-compose.yml tiene errores de sintaxis" -ForegroundColor Red
    docker-compose config
    exit 1
}

Write-Host ""

# Verificar que los archivos necesarios existan
Write-Host "✓ Verificando archivos necesarios..." -ForegroundColor Yellow

$requiredFiles = @(
    "backend/init.sql",
    "backend/Dockerfile",
    "backend/package.json",
    "frontend/Dockerfile",
    "frontend/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Archivo requerido no encontrado: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Ejecutar: docker-compose up --build" -ForegroundColor White
Write-Host "2. En otra terminal, ejecutar: .\run-tests.ps1" -ForegroundColor White
Write-Host ""
