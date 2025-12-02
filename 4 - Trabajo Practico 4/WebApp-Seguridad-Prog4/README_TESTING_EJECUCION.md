# 🧪 README: Testing y Ejecución de Seguridad

**Documento:** Guía completa para ejecutar, testear y validar la aplicación  
**Fecha:** 2 de diciembre de 2025  
**Objetivo:** Permitir a desarrolladores y testers ejecutar todos los tests de seguridad

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
3. [Tests Unitarios](#tests-unitarios)
4. [Tests de Integración](#tests-de-integración)
5. [Tests de Seguridad](#tests-de-seguridad)
6. [Validación Manual](#validación-manual)
7. [Debugging](#debugging)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuración Inicial

### Requisitos

```bash
# Verificar que tengas instalado:
node --version    # v14+
npm --version     # v6+
docker --version  # 20+
docker-compose --version  # 1.29+
```

### Clonar y Preparar

```bash
# 1. Clonar proyecto
git clone <repository>
cd Programacion-IV/4\ -\ Trabajo\ Practico\ 4/WebApp-Seguridad-Prog4

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Crear archivo .env
cd backend
cp .env.example .env

# Editar .env con tus valores:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=root123
# JWT_SECRET=your_secret_key_here
# SESSION_SECRET=your_session_secret
# NODE_ENV=development
```

### Estructura de Carpetas

```
WebApp-Seguridad-Prog4/
├── backend/
│   ├── src/
│   │   ├── middleware/       # Middleware de seguridad
│   │   ├── routes/           # Endpoints de la API
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── models/           # Modelos de BD
│   │   ├── utils/            # Funciones auxiliares
│   │   └── server.js         # Punto de entrada
│   ├── test/
│   │   ├── security/         # Tests de seguridad (8 archivos)
│   │   ├── unit/             # Tests unitarios
│   │   └── integration/      # Tests de integración
│   ├── package.json
│   ├── jest.config.js
│   └── .env                  # Secretos (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml        # Orquestación
```

---

## ▶️ Ejecutar la Aplicación

### Opción 1: Con Docker (Recomendado)

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Verificar que todo está corriendo
docker-compose ps

# OUTPUT esperado:
# CONTAINER ID   IMAGE          STATUS
# abc123         mysql:8.0      Up 2 minutes
# def456         node:16        Up 1 minute
# ghi789         node:16        Up 1 minute
```

### Opción 2: Local (Sin Docker)

```bash
# 1. Inicia base de datos (asume MySQL local)
mysql -u root -p < backend/init.sql

# 2. Inicia backend en terminal 1
cd backend
npm start
# Puerto: 5000

# 3. Inicia frontend en terminal 2
cd frontend
npm run dev
# Puerto: 5173
```

### Verificar que está funcionando

```bash
# Backend healthcheck
curl http://localhost:5000/api/health
# Esperado: { "status": "ok" }

# Frontend
open http://localhost:5173
# Debería cargar la página
```

---

## 📝 Tests Unitarios

### ¿Qué prueban?

- Funciones individuales (validadores, utils)
- Lógica de negocio aislada
- No requieren base de datos

### Ejecutar todos los tests

```bash
cd backend
npm test

# OUTPUT esperado:
# PASS  tests/unit/validators.test.js
#   ✓ should validate email format
#   ✓ should reject invalid emails
# PASS  tests/unit/auth.test.js
#   ✓ should hash password correctly
#   ✓ should compare passwords
#
# Tests:       12 passed, 12 total
# Time:        2.345s
```

### Ejecutar tests de un archivo específico

```bash
npm test -- tests/unit/validators.test.js
```

### Ver cobertura de código

```bash
npm test -- --coverage

# Genera reporte en: coverage/
# Abre en navegador: coverage/index.html
```

### Ejemplo: Entender un test unitario

```javascript
// tests/unit/auth.test.js
describe('Authentication', () => {
  describe('Password Hashing', () => {

    it('should hash password with bcrypt', async () => {
      // Arrange: preparar datos
      const password = 'mySecurePassword123';

      // Act: ejecutar la función
      const hash = await hashPassword(password);

      // Assert: verificar resultado
      expect(hash).not.toBe(password);  // No es igual
      expect(hash.length).toBeGreaterThan(30);  // Es un hash
      expect(await comparePasswords(password, hash)).toBe(true);
    });
  });
});

// Ejecutar este test:
npm test -- --testNamePattern="should hash password"
```

---

## 🔗 Tests de Integración

### ¿Qué prueban?

- Flujos completos (requests → BD)
- Múltiples componentes juntos
- Con base de datos real

### Ejecutar tests de integración

```bash
cd backend

# Todos los tests de integración
npm run test:integration

# Con salida detallada
npm run test:integration -- --verbose

# OUTPUT esperado:
# PASS  tests/integration/auth.int.test.js
#   Login Flow
#     ✓ should login with valid credentials
#     ✓ should reject invalid password
#     ✓ should rate limit after 5 attempts
#
# Tests:       8 passed, 8 total
```

### Ejemplo: Test de integración

```javascript
// tests/integration/auth.int.test.js
const request = require("supertest");
const app = require("../../src/server");
const { User } = require("../../src/models");

describe("Authentication Integration", () => {
  before(async () => {
    // Setup: crear usuario de prueba
    await User.create({
      username: "testuser",
      password: "test123",
    });
  });

  it("should login and return JWT token", async () => {
    // Arrange & Act: hacer login
    const response = await request(app).post("/api/login").send({
      username: "testuser",
      password: "test123",
    });

    // Assert: verificar respuesta
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.token).toMatch(/^eyJ/); // JWT valido
  });

  it("should reject invalid credentials", async () => {
    const response = await request(app).post("/api/login").send({
      username: "testuser",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });
});
```

---

## 🔒 Tests de Seguridad

### ¿Qué prueban?

- Vulnerabilidades específicas de OWASP
- Ataques reales contra la aplicación
- Mitigaciones funcionan

### Los 8 Tests de Seguridad

```
1. 01-brute-force.test.js          ← Ataque fuerza bruta
2. 02-command-injection.test.js    ← Inyección de comandos
3. 03-csrf.test.js                 ← CSRF (forgery)
4. 04-file-inclusion.test.js       ← Path traversal
5. 05-file-upload.test.js          ← Upload malicioso
6. 06-insecure-captcha.test.js     ← CAPTCHA débil
7. 07-sql-injection.test.js        ← SQL injection
8. 08-blind-sql-injection.test.js  ← Blind SQL injection
```

### Ejecutar todos los tests de seguridad

```bash
cd backend

# Todos los tests de seguridad
npm run test:security

# Con output detallado
npm run test:security -- --verbose

# OUTPUT esperado:
# PASS  tests/security/01-brute-force.test.js
#   ✓ should prevent brute force with rate limiting
#   ✓ should require CAPTCHA after 3 attempts
# PASS  tests/security/02-command-injection.test.js
#   ✓ should prevent command injection
# ...
# Tests:       32 passed, 32 total
# Time:        15.234s
```

### Ejecutar un test de seguridad específico

```bash
# Solo SQL Injection
npm run test:security -- 07-sql-injection.test.js

# Solo Brute Force
npm run test:security -- 01-brute-force.test.js
```

### Entender cada test de seguridad

#### 1️⃣ Brute Force Attack

```javascript
// tests/security/01-brute-force.test.js
describe("Brute Force Protection", () => {
  it("should rate limit login attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(app).post("/api/login").send({
        username: "admin",
        password: "wrongpass",
      });

      expect([200, 401]).toContain(response.status);
    }

    // 6to intento debe ser rechazado (429)
    const rateLimited = await request(app).post("/api/login").send({
      username: "admin",
      password: "wrongpass",
    });

    expect(rateLimited.status).toBe(429); // Too Many Requests
  });

  it("should require CAPTCHA after 3 attempts", async () => {
    // 3 intentos fallidos...

    // 4to intento requiere CAPTCHA
    const response = await request(app).post("/api/login").send({
      username: "admin",
      password: "wrongpass",
      // Sin captchaToken
    });

    expect(response.status).toBe(403);
    expect(response.body.captchaRequired).toBe(true);
  });
});
```

#### 2️⃣ Command Injection

```javascript
// tests/security/02-command-injection.test.js
describe("Command Injection Prevention", () => {
  it("should reject command injection in filenames", async () => {
    const response = await request(app)
      .post("/api/process-image")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "image.jpg; rm -rf /", // ← Payload malicioso
      });

    expect(response.status).toBe(400); // Bad request
    // No ejecuta el comando
  });
});
```

#### 3️⃣ CSRF

```javascript
// tests/security/03-csrf.test.js
describe("CSRF Protection", () => {
  it("should reject POST without CSRF token", async () => {
    const response = await request(app)
      .post("/api/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        toAccount: "attacker",
        amount: 9999,
      });

    expect(response.status).toBe(403); // Forbidden
    expect(response.body.error).toContain("CSRF");
  });
});
```

#### 7️⃣ SQL Injection

```javascript
// tests/security/07-sql-injection.test.js
describe("SQL Injection Prevention", () => {
  it("should prevent SQL injection in login", async () => {
    const response = await request(app).post("/api/login").send({
      username: "admin' OR '1'='1", // ← Payload clásico
      password: "anything",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });
});
```

---

## 🖱️ Validación Manual

### Probar Brute Force

```bash
# Terminal 1: Monitorear logs
docker logs -f <backend_container_id>

# Terminal 2: Hacer 10 intentos rápido
for i in {1..10}; do
  echo "=== Intento $i ==="
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpass"}'
  echo
done

# Resultado esperado:
# Primeros 5: 401 Unauthorized
# Intentos 6-10: 429 Too Many Requests
```

### Probar SQL Injection

```bash
# Test 1: Inyección en login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin\" OR \"1\"=\"1",
    "password": "anything"
  }'
# Resultado: 401 (no funciona la inyección)

# Test 2: Inyección en búsqueda de usuario
curl "http://localhost:5000/api/users?search=1%20OR%201=1" \
  -H "Authorization: Bearer $TOKEN"
# Resultado: Solo resultados legítimos, no todos los usuarios
```

### Probar Command Injection

```bash
# Test 1: Inyección en procesamiento
curl -X POST http://localhost:5000/api/process-image \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "image.jpg; cat /etc/passwd"
  }'
# Resultado: 400 Bad Request (no ejecuta comando)

# Test 2: Con caracteres especiales
curl -X POST http://localhost:5000/api/process-image \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"filename": "image$(whoami).jpg"}'
# Resultado: 400 Bad Request
```

### Probar File Inclusion (Path Traversal)

```bash
# Test 1: Acceder a archivo arriba
curl http://localhost:5000/api/file/../../etc/passwd
# Resultado: 403 Forbidden

# Test 2: Acceder a .env
curl http://localhost:5000/api/file/../../.env
# Resultado: 403 Forbidden

# Test 3: Acceso válido
curl http://localhost:5000/api/file/document.pdf
# Resultado: 200 OK (descarga archivo)
```

### Probar File Upload

```bash
# Test 1: Archivo válido
curl -F "file=@document.pdf" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/upload
# Resultado: 200 OK

# Test 2: Archivo disfrazado (PHP como JPG)
echo '<?php system($_GET["cmd"]); ?>' > shell.jpg
curl -F "file=@shell.jpg" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/upload
# Resultado: 400 Bad Request (contenido no coincide)

# Test 3: Archivo muy grande
dd if=/dev/zero of=large.bin bs=1M count=10
curl -F "file=@large.bin" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/upload
# Resultado: 413 Payload Too Large
```

### Probar CSRF

```bash
# Test 1: Obtener token CSRF
TOKEN=$(curl http://localhost:5000/api/csrf-token | jq -r '.csrfToken')
echo "Token: $TOKEN"

# Test 2: POST sin token (debe fallar)
curl -X POST http://localhost:5000/api/transfer \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"toAccount": "attacker", "amount": 1000}'
# Resultado: 403 Forbidden

# Test 3: POST con token (debe funcionar)
curl -X POST http://localhost:5000/api/transfer \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"toAccount": "user2", "amount": 100}'
# Resultado: 200 OK
```

---

## 🐛 Debugging

### Ver logs del backend

```bash
# Con Docker
docker logs -f <container_id>

# O directamente
cd backend
npm start

# Con más detalle
DEBUG=* npm start
```

### Ver logs de la BD

```bash
# Con Docker
docker exec -it <mysql_container> mysql -u root -p

# O en la terminal donde corre
# Los logs aparecen en la consola
```

### Conectar a la BD directamente

```bash
# Con Docker
docker exec -it <mysql_container> mysql -u root -proot123 -e "USE webapp; SELECT * FROM users;"

# Sin Docker
mysql -u root -proot123 -e "USE webapp; SELECT * FROM users;"
```

### Debugger de Node.js

```javascript
// En el código donde quieras debuggear:
debugger;  // ← El código se pausa aquí

// Ejecutar con debugger
node --inspect src/server.js

// Abrir DevTools en chrome://inspect
```

### Testing paso a paso

```javascript
// Ejecutar un test con detalle
npm test -- --verbose --bail

// --verbose: más output
// --bail: parar en el primer error

// Ver qué hace exactamente
npm test -- --verbose --runInBand
// --runInBand: no paralelizar (más fácil de seguir)
```

### Validar con curl con verbose

```bash
# Ver todo: headers, body, timing
curl -v -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Resultado muestra:
# > POST /api/login HTTP/1.1
# > Host: localhost:5000
# > Authorization: Bearer ...
# < HTTP/1.1 200 OK
# < Content-Type: application/json
# ...
```

---

## 🔧 Troubleshooting

### Error: "Cannot connect to Docker daemon"

```bash
# Solución: Iniciar Docker Desktop o Docker daemon
docker info

# O ejecutar sin Docker (ver "Opción 2: Local")
```

### Error: "Port 5000 already in use"

```bash
# Encontrar qué proceso usa el puerto
lsof -i :5000

# Matar el proceso
kill -9 <PID>

# O usar otro puerto
PORT=5001 npm start
```

### Error: "Database connection failed"

```bash
# Verificar credenciales en .env
cat backend/.env

# Verificar que MySQL está corriendo
mysql -u root -proot123 -e "SELECT 1"

# Verificar que la BD existe
mysql -u root -proot123 -e "USE webapp; SHOW TABLES;"
```

### Error: "Tests timing out"

```bash
# Aumentar timeout
npm test -- --testTimeout=30000  # 30 segundos

# O revisar si hay queries lentas
npm test -- --verbose --runInBand
```

### Error: "File not found" en uploads

```bash
# Verificar directorio de uploads existe
ls -la backend/uploads/

# Crear si no existe
mkdir -p backend/uploads

# Dar permisos
chmod 755 backend/uploads
```

### Error: "Authentication required" en tests

```bash
# Asegurar que el usuario de prueba existe
mysql -u root -proot123 webapp -e "INSERT INTO users VALUES (1, 'testuser', 'hashed_password');"

# O ejecutar seed script
npm run seed
```

---

## 📊 Matriz de Casos de Prueba

Disponible en: `MATRIZ_CASOS_PRUEBA.md`

Esta matriz documenta cada prueba:

- ID único
- Descripción
- Pasos para reproducir
- Resultado esperado
- Resultado actual
- Estado

---

## ✅ Checklist: Listo para Producción

- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan
- [ ] Todos los 8 tests de seguridad pasan
- [ ] Variables de entorno están configuradas
- [ ] HTTPS está habilitado
- [ ] Logs están configurados
- [ ] Base de datos está respaldada
- [ ] Permisos de archivos son restrictivos
- [ ] Secretos no están en código
- [ ] Headers de seguridad están configurados

---

## 📚 Documentos Relacionados

- [VULNERABILIDADES_DETALLADAS.md](./VULNERABILIDADES_DETALLADAS.md) - Análisis de cada vulnerabilidad
- [CORRECCIONES_IMPLEMENTADAS.md](./CORRECCIONES_IMPLEMENTADAS.md) - Código de las soluciones
- [GUIA_ANTES_DESPUES.md](./GUIA_ANTES_DESPUES.md) - Ejemplos prácticos
- [BUENAS_PRACTICAS_SEGURIDAD.md](./BUENAS_PRACTICAS_SEGURIDAD.md) - Principios de seguridad
- [MATRIZ_CASOS_PRUEBA.md](./MATRIZ_CASOS_PRUEBA.md) - Casos de prueba detallados

---

**Documento generado:** 2 de diciembre de 2025  
**Versión:** 1.0
