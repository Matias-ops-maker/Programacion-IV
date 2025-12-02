# 📑 Índice de Documentación - WebApp-Seguridad-Prog4

## 🎯 Selecciona tu Punto de Partida

### 👤 Soy Nuevo en el Proyecto

**→ Lee:** [`START_HERE.md`](START_HERE.md)

- Guía en 5 minutos
- Comandos esenciales
- Solución rápida de problemas

### 📚 Necesito Guía Completa

**→ Lee:** [`SETUP_GUIDE.md`](SETUP_GUIDE.md)

- Requisitos previos
- Instalación paso a paso
- Tests de seguridad detallado
- Troubleshooting exhaustivo
- Checklist final

### ⚡ Necesito Comandos Rápidos

**→ Lee:** [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md)

- Comandos esenciales
- Tests y desarrollo
- Docker útiles
- Monitoreo y debugging
- Tips y trucos

### 🔧 Necesito Información Técnica

**→ Lee:** [`WORK_SUMMARY.md`](WORK_SUMMARY.md)

- Descripción de cada script
- Arquitectura técnica
- Flujo de trabajo
- Métricas de implementación
- Vulnerabilidades a corregir

---

## 📋 Scripts Disponibles

### 🔴 Scripts Principales

#### verify-all.ps1 / verify-all.sh

```bash
# Windows
.\verify-all.ps1

# Linux/Mac
bash verify-all.sh
```

**¿Para qué?** Ejecuta TODAS las verificaciones automáticamente
**Duración:** 5-10 minutos
**Recomendación:** ⭐⭐⭐ COMIENZA AQUÍ

---

### 🟡 Scripts Individuales

#### verify-docker.ps1 / verify-docker.sh

```bash
# Windows
.\verify-docker.ps1

# Linux/Mac
bash verify-docker.sh
```

**¿Para qué?** Verifica que Docker esté instalado y configurado
**Duración:** 30 segundos

#### verify-e2e.ps1 / verify-e2e.sh

```bash
# Windows
.\verify-e2e.ps1

# Linux/Mac
bash verify-e2e.sh
```

**¿Para qué?** Valida que todos los servicios funcionen
**Duración:** 1-2 minutos

#### run-security-tests.ps1 / run-security-tests.sh

```bash
# Windows
.\run-security-tests.ps1

# Linux/Mac
bash run-security-tests.sh
```

**¿Para qué?** Ejecuta tests de vulnerabilidades
**Duración:** 2-5 minutos

---

## 🌐 Acceso a Servicios

Una vez que todo está corriendo:

| Servicio    | URL                                    | Puerto | Usuario | Contraseña |
| ----------- | -------------------------------------- | ------ | ------- | ---------- |
| Frontend    | http://localhost:3000                  | 3000   | -       | -          |
| API Backend | http://localhost:5000/api              | 5000   | -       | -          |
| Productos   | http://localhost:5000/api/products     | 5000   | -       | -          |
| CAPTCHA     | http://localhost:5000/api/auth/captcha | 5000   | -       | -          |
| MySQL       | localhost:3306                         | 3306   | appuser | apppass123 |

**Credenciales de Prueba:**

```
Usuario: admin / admin123
Usuario: user1 / user123
```

---

## 📊 Estructura del Proyecto

```
WebApp-Seguridad-Prog4/
│
├── 📄 Documentación
│   ├── START_HERE.md                 ← Comienza aquí (5 min)
│   ├── SETUP_GUIDE.md                ← Guía completa
│   ├── QUICK_REFERENCE.md            ← Referencia rápida
│   ├── WORK_SUMMARY.md               ← Info técnica
│   └── DOCUMENTATION_INDEX.md        ← Este archivo
│
├── 🔴 Scripts Maestros
│   ├── verify-all.ps1                ← TODO en Windows
│   └── verify-all.sh                 ← TODO en Linux/Mac
│
├── 🟡 Scripts Específicos
│   ├── verify-docker.ps1/sh          ← Verifica Docker
│   ├── verify-e2e.ps1/sh             ← Valida servicios
│   ├── run-security-tests.ps1/sh     ← Ejecuta tests
│   └── setup.sh/setup.bat            ← Setup original
│
├── 📁 Backend (Node.js/Express)
│   ├── src/
│   │   ├── server.js                 ← Servidor principal
│   │   ├── config/                   ← Configuración
│   │   ├── controllers/              ← Lógica
│   │   ├── middleware/               ← Middleware
│   │   ├── routes/                   ← Rutas API
│   │   ├── utils/                    ← Utilidades
│   │   └── types/                    ← Tipos
│   ├── test/
│   │   ├── security/                 ← Tests de vulnerabilidades
│   │   ├── run-security-tests.js     ← Ejecutor de tests
│   │   └── setup.js                  ← Setup de tests
│   ├── jest.config.js                ← Config Jest
│   ├── package.json                  ← Dependencias
│   ├── Dockerfile                    ← Imagen Docker
│   ├── init.sql                      ← Script DB
│   └── INSTRUCCIONES.md              ← Vulnerabilidades
│
├── 📁 Frontend (React/Vite/TypeScript)
│   ├── src/
│   │   ├── main.tsx                  ← Entry point
│   │   ├── App.tsx                   ← App principal
│   │   ├── components/               ← Componentes React
│   │   ├── services/                 ← API services
│   │   └── types/                    ← Tipos TypeScript
│   ├── package.json                  ← Dependencias
│   ├── vite.config.ts                ← Config Vite
│   ├── tsconfig.json                 ← Config TypeScript
│   └── Dockerfile                    ← Imagen Docker
│
├── 🐳 Docker
│   ├── docker-compose.yml            ← Orquestación
│   └── verification-logs/            ← Logs automáticos
│
├── 📊 Reportes (Auto-generados)
│   └── TEST_REPORT_*.md              ← Reportes de tests
│
└── 📄 Otros
    ├── README.md                     ← Info general
    ├── PRESENTACION.md               ← Presentación
    └── .gitignore
```

---

## 🎯 Flujos de Trabajo Típicos

### Escenario 1: Primera Vez

```
1. Lee START_HERE.md (5 min)
   ↓
2. Ejecuta .\verify-all.ps1 (o bash verify-all.sh)
   ↓
3. Espera resultados (5-10 min)
   ↓
4. ✅ Si todo está bien → Accede a http://localhost:3000
   ✅ Si hay problemas → Consulta SETUP_GUIDE.md
```

### Escenario 2: Ejecutar Tests Diariamente

```
1. Verifica que servicios están corriendo
   docker-compose ps
   ↓
2. Ejecuta tests de seguridad
   .\run-security-tests.ps1 (o bash run-security-tests.sh)
   ↓
3. Revisa reporte
   cat TEST_REPORT_*.md
```

### Escenario 3: Debugging

```
1. Ver estado de servicios
   docker-compose ps
   ↓
2. Ver logs
   docker-compose logs -f
   ↓
3. Validar E2E
   .\verify-e2e.ps1 (o bash verify-e2e.sh)
   ↓
4. Reiniciar si necesario
   docker-compose down && docker-compose up --build
```

---

## 🧪 Vulnerabilidades a Corregir

| #   | Vulnerabilidad      | Test                           | Descripción                 |
| --- | ------------------- | ------------------------------ | --------------------------- |
| 1   | Brute Force         | 01-brute-force.test.js         | Implementar rate limiting   |
| 2   | Command Injection   | 02-command-injection.test.js   | Validar entrada de comandos |
| 3   | CSRF Protection     | 03-csrf-protection.test.js     | Agregar tokens CSRF         |
| 4   | File Inclusion      | 04-file-inclusion.test.js      | Validar rutas de archivos   |
| 5   | File Upload         | 05-file-upload.test.js         | Validar tipos y tamaños     |
| 6   | Insecure CAPTCHA    | 06-insecure-captcha.test.js    | Implementar CAPTCHA seguro  |
| 7   | SQL Injection       | 07-sql-injection.test.js       | Usar prepared statements    |
| 8   | Blind SQL Injection | 08-blind-sql-injection.test.js | Validar todas las entradas  |

---

## 🆘 Solución Rápida de Problemas

### Problema: "Command not found: docker"

**Solución:** Instala Docker desde https://www.docker.com/

### Problema: "Port 5000 already in use"

**Solución:** Usa otro puerto en docker-compose.yml o mata el proceso

### Problema: "Cannot find module"

**Solución:**

```bash
cd backend
npm install
```

### Problema: "Service not responding"

**Solución:**

```bash
docker-compose down -v
docker-compose up --build
```

**→ Más soluciones:** Ver SETUP_GUIDE.md

---

## 📞 Referencias Rápidas

### Comandos Esenciales

```bash
# Iniciar
docker-compose up --build

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Tests
npm run test:security

# Verificación completa
.\verify-all.ps1  # o bash verify-all.sh
```

### Más Comandos

**→ Ver:** QUICK_REFERENCE.md

---

## 📈 Próximas Acciones

1. **Ahora:** Lee [`START_HERE.md`](START_HERE.md)
2. **Luego:** Ejecuta `./verify-all.ps1` o `bash verify-all.sh`
3. **Después:** Accede a http://localhost:3000
4. **Finalmente:** Trabaja en corregir vulnerabilidades

---

## 📚 Referencias Externas

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## ✅ Verificación Final

Antes de empezar, asegúrate que:

- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] Node.js instalado (`node --version`)
- [ ] Tienes los scripts (.sh y .ps1)
- [ ] Acceso a internet para descargar imágenes Docker

---

## 🎓 Información Importante

**Esta aplicación contiene vulnerabilidades intencionales para fines educativos.**

⚠️ **NO USAR EN PRODUCCIÓN**

**Objetivos de aprendizaje:**

- ✅ Identificar vulnerabilidades comunes
- ✅ Entender cómo explotar vulnerabilidades
- ✅ Aprender a corregirlas
- ✅ Implementar defensas adecuadas

---

## 🚀 ¡Comienza Ya!

```bash
# Windows
.\verify-all.ps1

# Linux/Mac
bash verify-all.sh
```

**Duración:** 5-10 minutos  
**Resultado:** ✅ Aplicación completamente funcional

---

**Documento generado:** 2 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Completado

**Última actualización:** 2 de diciembre de 2025
