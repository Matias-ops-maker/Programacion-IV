# 🚀 Referencia Rápida de Comandos

## 📌 Comandos Esenciales

### Iniciar la Aplicación

```bash
# Todo en un comando (recomendado)
docker-compose up --build -d

# Iniciar en foreground (para ver logs)
docker-compose up --build

# Iniciar servicios en background
docker-compose up -d
```

### Ver Estado de Servicios

```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### Detener Servicios

```bash
# Detener servicios sin eliminar volúmenes
docker-compose down

# Detener y eliminar volúmenes (reset completo)
docker-compose down -v

# Detener un servicio específico
docker-compose stop backend
```

---

## 🧪 Comandos de Testing

### Ejecutar Script Maestro (TODO)

**Windows:**
```powershell
.\verify-all.ps1
```

**Linux/Mac:**
```bash
bash verify-all.sh
```

### Ejecutar Tests Individuales

**Verificar Docker:**
```bash
# Windows
.\verify-docker.ps1

# Linux/Mac
bash verify-docker.sh
```

**Validación E2E:**
```bash
# Windows
.\verify-e2e.ps1

# Linux/Mac
bash verify-e2e.sh
```

**Tests de Seguridad:**
```bash
# Windows
.\run-security-tests.ps1

# Linux/Mac
bash run-security-tests.sh
```

### Tests Manuales

```bash
cd backend

# Instalar dependencias
npm install

# Ejecutar todos los tests de seguridad
npm run test:security

# Ejecutar tests en modo watch
npm run test

# Tests con cobertura
npm run test:coverage

# Tests en modo CI
npm run test:ci
```

---

## 🔧 Comandos de Desarrollo

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Iniciar servidor en desarrollo (con nodemon)
npm start

# Ejecutar en puerto específico
PORT=5001 npm start
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar en desarrollo (Vite)
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Tests
npm test
```

---

## 🐳 Comandos de Docker Útiles

### Contenedores

```bash
# Ver todos los contenedores (corriendo y parados)
docker ps -a

# Ver contenedores corriendo
docker ps

# Entrar a un contenedor
docker exec -it vulnerable_backend bash
docker exec -it vulnerable_mysql bash

# Ver logs de un contenedor
docker logs vulnerable_backend
docker logs --follow vulnerable_backend

# Eliminar un contenedor
docker rm vulnerable_backend
```

### Imágenes

```bash
# Ver imágenes descargadas
docker images

# Reconstruir imágenes
docker-compose build --no-cache

# Eliminar imagen
docker rmi image_name
```

### Network y Volúmenes

```bash
# Ver redes
docker network ls

# Ver volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect vulnerable_app_mysql_data
```

---

## 📊 Monitoreo y Debugging

### Ver Logs

```bash
# Todos los logs
docker-compose logs

# Logs en tiempo real
docker-compose logs -f

# Últimas 100 líneas
docker-compose logs --tail=100

# Logs de hace 5 minutos
docker-compose logs --since 5m
```

### Estadísticas

```bash
# Ver uso de recursos
docker stats

# Ver uso de un contenedor específico
docker stats vulnerable_backend
```

### Inspeccionar Servicios

```bash
# Información detallada
docker-compose config

# Validar sintaxis de docker-compose.yml
docker-compose config --quiet

# Ver variables de entorno
docker exec vulnerable_backend env
```

---

## 🔒 Verificación de Seguridad

### Ejecutar Tests

```bash
# Script maestro (recomendado)
bash verify-all.sh          # Linux/Mac
.\verify-all.ps1            # Windows

# Tests individuales
npm run test:security       # Backend
cd backend && npm run test  # Tests en general
```

### Ver Resultados

```bash
# Ver reportes generados
ls -la TEST_REPORT_*.md
ls -la verification-logs/

# Ver contenido del reporte
cat TEST_REPORT_*.md
```

---

## 📱 Acceder a la Aplicación

### URLs de Acceso

```
Frontend:     http://localhost:3000
Backend API:  http://localhost:5000
Products:     http://localhost:5000/api/products
CAPTCHA:      http://localhost:5000/api/auth/captcha
```

### Credenciales de Prueba

```
Usuario: admin
Contraseña: admin123

Usuario: user1
Contraseña: user123
```

---

## 🔄 Flujo Típico de Trabajo

### Día 1: Configuración Inicial

```bash
# 1. Verificar requisitos
docker --version
node --version

# 2. Verificar Docker Compose
bash verify-docker.sh  # o .\verify-docker.ps1

# 3. Iniciar servicios
docker-compose up --build -d

# 4. Esperar a que inicien y validar
sleep 10
bash verify-e2e.sh  # o .\verify-e2e.ps1

# 5. Ver estado
docker-compose ps
```

### Días Siguientes: Desarrollo y Testing

```bash
# 1. Verificar que todo esté corriendo
docker-compose ps

# 2. Ejecutar tests de seguridad
bash run-security-tests.sh  # o .\run-security-tests.ps1

# 3. Ver logs si hay errores
docker-compose logs

# 4. Hacer cambios en código

# 5. Reiniciar servicio afectado
docker-compose restart backend

# 6. Verificar cambios
curl http://localhost:5000/api
```

---

## 🧹 Limpieza y Reset

### Reset Completo

```bash
# Detener todo y eliminar datos
docker-compose down -v

# Eliminar caché de imágenes
docker system prune

# Reiniciar desde cero
docker-compose up --build
```

### Limpiar Solo Datos

```bash
# Eliminar volumen de BD (perderás datos)
docker volume rm vulnerable_app_mysql_data

# Reiniciar MySQL
docker-compose restart mysql
```

---

## ⚡ Tips y Trucos

### Ejecución Rápida

```bash
# Alias útiles (agregar a .bashrc o .zshrc)
alias dcup="docker-compose up -d"
alias dcdown="docker-compose down"
alias dclogs="docker-compose logs -f"
alias dcps="docker-compose ps"

# Luego usar
dcup
dclogs
```

### Terminal Mejorada

```bash
# Ver colores en logs de Windows PowerShell
$PSDefaultParameterValues['Out-Default:OutVariable'] = 'LastOut'

# Seguimiento de cambios en código
npm install -g nodemon
nodemon --exec 'npm test:security'
```

---

## 🆘 Ayuda Rápida

```bash
# Ver ayuda de Docker Compose
docker-compose help

# Ver ayuda de comando específico
docker-compose help up
docker-compose help logs

# Validar configuración
docker-compose config

# Ver versiones
docker-compose version
docker version
```

---

**Última actualización:** 2 de diciembre de 2025

