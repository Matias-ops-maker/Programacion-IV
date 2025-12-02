# 🎯 Guía de Inicio Rápido - WebApp-Seguridad-Prog4

## ⚡ En 5 Minutos

### 1️⃣ Verificar que tengas todo instalado

```bash
docker --version
docker-compose --version
node --version
```

Si alguno no está instalado, descárgalo desde:

- Docker: https://www.docker.com/products/docker-desktop
- Node.js: https://nodejs.org/

### 2️⃣ Ejecutar la verificación completa

**En Windows (PowerShell):**

```powershell
.\verify-all.ps1
```

**En Linux/Mac (Terminal/Bash):**

```bash
bash verify-all.sh
```

### 3️⃣ Esperar a que termine

El script automáticamente:

- ✅ Verifica Docker
- ✅ Inicia los servicios
- ✅ Valida que funcione todo
- ✅ Ejecuta tests de seguridad
- ✅ Genera reporte

### 4️⃣ Ver resultados

```
✅ TODAS LAS VERIFICACIONES PASARON ✅
```

---

## 📚 Documentos Importantes

| Documento              | Para Qué                | Cuándo Leerlo                 |
| ---------------------- | ----------------------- | ----------------------------- |
| **SETUP_GUIDE.md**     | Guía detallada completa | Cuando necesites detalles     |
| **QUICK_REFERENCE.md** | Comandos útiles         | Para recordar comandos        |
| **WORK_SUMMARY.md**    | Resumen técnico         | Para entender la arquitectura |

---

## 🚀 Próximos Pasos

### Opción A: Verificación Automática (Recomendado)

```bash
# Windows
.\verify-all.ps1

# Linux/Mac
bash verify-all.sh
```

Este script hace TODO automáticamente.

### Opción B: Paso a Paso Manual

```bash
# 1. Verificar Docker
.\verify-docker.ps1  # o bash verify-docker.sh

# 2. Iniciar servicios
docker-compose up --build -d

# 3. Esperar 10 segundos y validar
.\verify-e2e.ps1  # o bash verify-e2e.sh

# 4. Ejecutar tests
.\run-security-tests.ps1  # o bash run-security-tests.sh
```

---

## 🌐 Acceder a la Aplicación

Una vez que todo esté corriendo:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Productos:** http://localhost:5000/api/products

### Credenciales de Prueba

```
Usuario: admin
Contraseña: admin123

Usuario: user1
Contraseña: user123
```

---

## 📊 Qué Verifican los Tests

8 vulnerabilidades de seguridad:

1. ✅ Brute Force Protection
2. ✅ Command Injection Prevention
3. ✅ CSRF Protection
4. ✅ File Inclusion Prevention
5. ✅ File Upload Validation
6. ✅ Insecure CAPTCHA
7. ✅ SQL Injection Prevention
8. ✅ Blind SQL Injection Prevention

---

## 🆘 Si Algo Falla

### Docker no inicia

```bash
# Reinicia Docker
docker restart

# Linux
sudo systemctl restart docker
```

### Puerto ya en uso

```bash
# Ver qué ocupa puerto 5000
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

### Servicios no responden

```bash
# Ver logs
docker-compose logs

# Reiniciar todo
docker-compose down
docker-compose up --build
```

### Tests fallan

```bash
# Espera a que BD esté lista
sleep 10

# Ejecuta tests de nuevo
cd backend && npm run test:security
```

---

## 📂 Estructura de Archivos

```
WebApp-Seguridad-Prog4/
├── verify-all.sh/ps1           ← Script maestro (EMPIEZA AQUÍ)
├── verify-docker.sh/ps1        ← Verificar Docker
├── verify-e2e.sh/ps1           ← Validar servicios
├── run-security-tests.sh/ps1   ← Ejecutar tests
├── SETUP_GUIDE.md              ← Guía detallada
├── QUICK_REFERENCE.md          ← Referencia rápida
├── backend/                    ← Código del servidor
├── frontend/                   ← Interfaz web
└── docker-compose.yml          ← Configuración Docker
```

---

## 💡 Tips Útiles

### Ver logs en tiempo real

```bash
docker-compose logs -f
```

### Ver estado de servicios

```bash
docker-compose ps
```

### Entrar a un contenedor

```bash
docker exec -it vulnerable_backend bash
```

### Reset completo

```bash
docker-compose down -v
docker-compose up --build
```

---

## ✅ Checklist de Verificación

Después de ejecutar los scripts, asegúrate que:

- [ ] Docker está corriendo (`docker-compose ps` muestra "Up")
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend responde en http://localhost:5000
- [ ] BD MySQL inicializa correctamente
- [ ] Tests de seguridad reportan estado
- [ ] Reporte guardado en `TEST_REPORT_*.md`
- [ ] Logs disponibles en `verification-logs/`

---

## 📞 Necesitas Ayuda?

1. **Lee primero:** SETUP_GUIDE.md
2. **Busca comando:** QUICK_REFERENCE.md
3. **Revisa logs:** `verification-logs/`
4. **Docker logs:** `docker-compose logs`

---

## 🎓 Información Importante

Esta aplicación ha sido diseñada **intencionalmente con vulnerabilidades** para fines educativos.

**⚠️ NO USES EN PRODUCCIÓN**

Tu objetivo es:

1. Entender cómo explotar vulnerabilidades
2. Aprender a corregirlas
3. Implementar defensas adecuadas

---

## 🚀 Comienza Ya

```bash
# Windows
.\verify-all.ps1

# Linux/Mac
bash verify-all.sh
```

**¡Es todo lo que necesitas ejecutar!** 🎉

---

**Última actualización:** 2 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para Usar
