# 🔐 Guía de Configuración y Testing - WebApp-Seguridad-Prog4

## 📋 Contenido
1. [Descripción General](#descripción-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Verificación Inicial](#verificación-inicial)
4. [Ejecución de Tests](#ejecución-de-tests)
5. [Validación End-to-End](#validación-end-to-end)
6. [Scripts Disponibles](#scripts-disponibles)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Descripción General

Esta guía te ayudará a:
- ✅ Verificar que Docker Compose funcione correctamente
- ✅ Ejecutar todos los tests de seguridad
- ✅ Validar la aplicación end-to-end
- ✅ Automatizar las verificaciones

**Nota:** Esta aplicación ha sido diseñada intencionalmente con 8 vulnerabilidades críticas para fines educativos.

---

## ⚙️ Requisitos Previos

### Instalaciones Necesarias

1. **Docker Desktop** (incluye Docker y Docker Compose)
   - Windows/Mac: https://www.docker.com/products/docker-desktop
   - Linux: `sudo apt-get install docker.io docker-compose`

2. **Node.js** (v14 o superior)
   - https://nodejs.org/
   - Verifica: `node --version` y `npm --version`

3. **Git** (para control de versiones)
   - https://git-scm.com/

### Verificar Instalaciones

```bash
# En Terminal/PowerShell, ejecuta:
docker --version
docker-compose --version
node --version
npm --version
```

---

## 🚀 Verificación Inicial

### En Windows (PowerShell)

```powershell
# 1. Abre PowerShell en el directorio del proyecto
cd "c:\Users\Ignacio\Desktop\Programacion-IV\4 - Trabajo Practico 4\WebApp-Seguridad-Prog4"

# 2. Ejecuta la verificación de Docker
.\verify-docker.ps1

# 3. Si todo está bien, inicia Docker Compose
docker-compose up --build -d

# 4. Espera 5-10 segundos y valida E2E
.\verify-e2e.ps1
```

### En Linux/Mac (Bash)

```bash
# 1. Navega al directorio del proyecto
cd "4 - Trabajo Practico 4/WebApp-Seguridad-Prog4"

# 2. Dale permisos de ejecución a los scripts
chmod +x verify-docker.sh verify-e2e.sh run-security-tests.sh verify-all.sh

# 3. Ejecuta la verificación de Docker
bash verify-docker.sh

# 4. Si todo está bien, inicia Docker Compose
docker-compose up --build -d

# 5. Espera 5-10 segundos y valida E2E
bash verify-e2e.sh
```

---

## 🧪 Ejecución de Tests

### Tests de Seguridad

La suite de tests verifica 8 vulnerabilidades críticas:

| # | Vulnerabilidad | Descripción |
|---|---|---|
| 1 | **Brute Force** | Protección contra ataques de fuerza bruta |
| 2 | **Command Injection** | Prevención de inyección de comandos |
| 3 | **CSRF Protection** | Token CSRF en formularios |
| 4 | **File Inclusion** | Prevención de inclusión de archivos |
| 5 | **File Upload** | Validación segura de subida de archivos |
| 6 | **Insecure CAPTCHA** | CAPTCHA seguro |
| 7 | **SQL Injection** | Prevención de inyección SQL |
| 8 | **Blind SQL Injection** | Prevención de inyección SQL ciega |

### Ejecutar Tests

#### Windows (PowerShell)
```powershell
.\run-security-tests.ps1
```

#### Linux/Mac (Bash)
```bash
bash run-security-tests.sh
```

O manualmente:
```bash
cd backend
npm install
npm run test:security
```

### Interpretar Resultados

```
✅ PASS - Test pasó correctamente
❌ FAIL - Test falló (vulnerabilidad aún presente)
```

El script genera un reporte automático con timestamp en la raíz del proyecto.

---

## 🔗 Validación End-to-End

Verifica que todos los servicios funcionen correctamente:

### Windows (PowerShell)
```powershell
.\verify-e2e.ps1
```

### Linux/Mac (Bash)
```bash
bash verify-e2e.sh
```

### Qué Verifica

- ✅ Base de datos MySQL (puerto 3306)
- ✅ Backend API (puerto 5000)
- ✅ Frontend (puerto 3000)
- ✅ Endpoints básicos de API

### Endpoint de Prueba

Una vez validado, puedes acceder a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Products**: http://localhost:5000/api/products
- **API CAPTCHA**: http://localhost:5000/api/auth/captcha

---

## 📜 Scripts Disponibles

### Script Maestro (Recomendado)

Ejecuta todas las verificaciones en orden:

#### Windows
```powershell
.\verify-all.ps1
```

#### Linux/Mac
```bash
bash verify-all.sh
```

**Incluye:**
1. Verificación de Docker
2. Inicio de servicios Docker
3. Validación E2E
4. Tests de seguridad
5. Reporte final

### Scripts Individuales

#### 1. Verificar Docker
```bash
# Windows
.\verify-docker.ps1

# Linux/Mac
bash verify-docker.sh
```

#### 2. Validar E2E
```bash
# Windows
.\verify-e2e.ps1

# Linux/Mac
bash verify-e2e.sh
```

#### 3. Ejecutar Tests de Seguridad
```bash
# Windows
.\run-security-tests.ps1

# Linux/Mac
bash run-security-tests.sh
```

---

## 📊 Reportes y Logs

Los logs se guardan automáticamente en: `verification-logs/`

### Archivos de Log

```
verification-logs/
├── 01-docker-verification-YYYYMMDD_HHMMSS.log
├── 02-docker-up-YYYYMMDD_HHMMSS.log
├── 03-e2e-validation-YYYYMMDD_HHMMSS.log
└── 04-security-tests-YYYYMMDD_HHMMSS.log
```

### Reportes de Tests

```
TEST_REPORT_YYYYMMDD_HHMMSS.md
```

---

## 🛠️ Solución de Problemas

### Problema: Docker no inicia

**Solución:**
```bash
# Reinicia Docker Desktop o el daemon
docker restart

# En Linux
sudo systemctl restart docker
```

### Problema: Puerto ya en uso

**Solución:**
```bash
# Mira qué está usando el puerto (ejemplo: 5000)
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Detén el proceso o usa otro puerto en docker-compose.yml
```

### Problema: Servicios no inician correctamente

**Solución:**
```bash
# Ver logs de los servicios
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs mysql
docker-compose logs backend
docker-compose logs frontend

# Reiniciar servicios
docker-compose down
docker-compose up --build
```

### Problema: Dependencias de Node no instalan

**Solución:**
```bash
cd backend

# Elimina node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstala
npm install

# Intenta con npm ci (para CI/CD)
npm ci
```

### Problema: Tests fallan sin motivo aparente

**Solución:**
```bash
# Asegúrate que los servicios estén corriendo
docker-compose ps

# Espera más tiempo para que se inicialicen
docker-compose logs

# Reinicia todo desde cero
docker-compose down -v
docker-compose up --build
```

---

## 📚 Recursos Adicionales

### Documentación Importante

- **INSTRUCCIONES.md**: Guía completa de vulnerabilidades
- **README.md**: Información general del proyecto
- **MATRIZ_CASOS_PRUEBA.md**: Matriz de casos de prueba

### Archivos de Configuración

- `docker-compose.yml`: Configuración de servicios
- `backend/init.sql`: Script de inicialización de BD
- `backend/jest.config.js`: Configuración de tests
- `backend/package.json`: Dependencias del backend
- `frontend/package.json`: Dependencias del frontend

---

## ✅ Checklist Final

Antes de considerar el proyecto completado:

- [ ] Docker Compose verifica correctamente
- [ ] Todos los servicios inician sin errores
- [ ] Validación E2E pasa exitosamente
- [ ] Todos los 8 tests de seguridad pasan (✅)
- [ ] Base de datos MySQL inicializa correctamente
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend API accesible en http://localhost:5000
- [ ] Scripts de verificación funcionan automáticamente

---

## 📞 Soporte y Contacto

En caso de problemas no resueltos:

1. Revisa los logs en `verification-logs/`
2. Ejecuta `docker-compose logs` para ver errores
3. Consulta la documentación en INSTRUCCIONES.md
4. Verifica que todos los requisitos estén instalados

---

**Última actualización:** 2 de diciembre de 2025

**Estado:** ✅ Listo para usar

