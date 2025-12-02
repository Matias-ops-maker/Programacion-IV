# 🔍 REVISIÓN DE CÓDIGO: Análisis de Implementaciones de Seguridad

**Fecha:** Diciembre 2025  
**Proyecto:** WebApp-Seguridad-Prog4  
**Revisor:** Ignacio (Supervisor)  
**Commits Analizados:** 5 (4f27a52, d5a8d58, 5a889a3, 98079a9, 9e25d5c)

---

## 📋 Resumen Ejecutivo

Se ha realizado una revisión completa de código de los commits de seguridad implementados por los estudiantes. El trabajo muestra **buena comprensión de conceptos** y **implementaciones funcionales**, pero identifica **gaps importantes** en robustez y completitud de protecciones.

### Puntuación General: 7/10

- ✅ **Fortalezas:** Validación de entrada, middlewares de seguridad, bloqueo de ataques básicos
- ⚠️ **Debilidades:** Persistencia de datos, escalabilidad, completitud de mitigaciones
- 🔴 **Críticos:** Algunos vectores de ataque aún funcionan, falta hardening

---

## 🔐 Análisis por Vulnerabilidad

### 1. BRUTE FORCE PROTECTION ✅ (70%)

**Implementación:** `backend/src/middleware/bruteForce.js`

#### ✅ Lo que está BIEN:

```javascript
// Rate limiting con limite de 5 intentos
if (attempts > 5) {
  return res.status(429).json({ error: 'Too many requests' });
}

// Delay progresivo exponencial
const delay = Math.min(300 * Math.pow(2, attempts - 2), 8000);
await new Promise(resolve => setTimeout(resolve, delay));

// CAPTCHA requerido después de 3 intentos
if (attempts > 3 && !req.body.captcha) {
  return res.status(400).json({ error: "Se requiere verificación captcha" });
}
```

**Positivos:**
- ✅ Delays exponenciales bien implementados
- ✅ CAPTCHA requerido tras N intentos
- ✅ Contador por IP individual
- ✅ Respuesta 429 (Too Many Requests)

#### ⚠️ Lo que FALTA o es DÉBIL:

1. **Persistencia de datos perdida al reiniciar**
   - Los contadores están en memoria (`failedAttempts = {}`)
   - Se pierden si el servidor se reinicia
   - **Solución:** Usar Redis o base de datos

2. **Sin registro de intentos en BD**
   - No hay auditoría de intentos fallidos
   - No se pueden analizar patrones de ataque
   - **Solución:** Guardar en tabla `login_attempts` con IP, timestamp, usuario

3. **Sin bloqueo temporal de IP**
   - Después de exceder límite, no hay bloqueo de segundos/minutos
   - Atacante puede reintentar inmediatamente
   - **Solución:** Implementar bloqueo temporal (e.g., 15 min)

4. **Sin validación de CAPTCHA real**
   - El código pide CAPTCHA pero sin verificar completamente
   - CAPTCHA debe validarse antes de aceptar login
   - **Solución:** Verificar token CAPTCHA válido

#### 📝 Recomendación:

```javascript
// MEJORADO: Con persistencia en Redis
const redis = require('redis');
const client = redis.createClient();

async function recordFailedAttempt(ip) {
  const key = `login_attempts:${ip}`;
  const attempts = await client.incr(key);
  if (attempts === 1) {
    await client.expire(key, 900); // 15 min
  }
  return attempts;
}

async function isIPBlocked(ip) {
  const key = `blocked:${ip}`;
  return await client.exists(key);
}

// Si excede límite, bloquear
if (attempts > 5) {
  await client.setex(`blocked:${ip}`, 900, 'blocked'); // 15 min
  return res.status(429).json({ error: 'Too many requests' });
}
```

---

### 2. COMMAND INJECTION PREVENTION ✅ (80%)

**Implementación:** `backend/src/controllers/vulnerabilityController.js` - `ping()` function

#### ✅ Lo que está BIEN:

```javascript
// Validación estricta de caracteres shell peligrosos
const forbiddenShellChars = /[`$&|;<>]/;
if (forbiddenShellChars.test(trimmed)) {
  return res.status(400).json({ error: "Invalid host" });
}

// Whitelist de hosts permitidos
const allowedHosts = ["8.8.8.8", "1.1.1.1", "google.com"];
if (!allowedHosts.includes(trimmed)) {
  return res.status(400).json({ error: "Host not allowed" });
}

// Validación de formato IP/Hostname
const ipRegex = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const hostnameRegex = /^[a-zA-Z0-9.-]+$/;

// Uso de DNS nativo (NO exec/spawn)
const { address } = await dns.lookup(trimmed);
```

**Positivos:**
- ✅ Whitelist de caracteres shell bloqueado
- ✅ Whitelist de hosts permitidos
- ✅ Validación de formato IP estricta
- ✅ Uso de `dns.lookup()` sin shell

#### ⚠️ Lo que FALTA:

1. **Whitelist de hosts muy restringida**
   - Solo `8.8.8.8`, `1.1.1.1`, `google.com`
   - Poco útil en producción
   - **Solución:** Permitir customización en config

2. **Sin timeout en DNS lookup**
   - Un lookup puede colgar indefinidamente
   - **Solución:** Agregar timeout

3. **Respuesta genérica podría mejorar**
   - Algunos errores podrían revelar información
   - **Solución:** Todas las respuestas deben ser igual de genéricas

#### 📝 Recomendación:

```javascript
// MEJORADO: Con timeout y mejor manejo
const { timeout } = require('promise-timeout');

async function pingSecure(host) {
  // Timeout de 5 segundos
  const promise = dns.lookup(host);
  const result = await timeout(promise, 5000);
  return result;
}

try {
  const { address } = await pingSecure(trimmed);
  return res.status(200).json({ output: `PING ${trimmed} (${address}) - OK` });
} catch (e) {
  // Mismo mensaje para todos los errores
  return res.status(400).json({ error: "Invalid host" });
}
```

---

### 3. CSRF PROTECTION ✅ (75%)

**Implementación:** `backend/src/middleware/csrf.js`

#### ✅ Lo que está BIEN:

```javascript
const csrfProtection = csrf(); // Token en sesión (seguro)

const originCheck = (req, res, next) => {
  const origin = req.get("origin") || req.get("referer");
  // Validar contra whitelist
  if (origin && ![...allowedOrigins].some((o) => origin.startsWith(o))) {
    return res.status(403).json({ error: "Invalid Origin" });
  }
  next();
};

// Error handler específico para CSRF
const csrfErrorHandler = (err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "CSRF token invalid or missing" });
  }
  return next(err);
};
```

**Positivos:**
- ✅ Token en sesión (no cookie visible)
- ✅ Validación de Origin/Referer
- ✅ Error handler específico
- ✅ Whitelist de orígenes permitidos

#### ⚠️ Lo que FALTA:

1. **SameSite no está configurado explícitamente**
   - No hay seguridad a nivel de cookie
   - **Solución:** Configurar `SameSite=Strict` en sesión

2. **Transfer endpoint NO usa CSRF**
   ```javascript
   // VULNERABLE: Sin protección CSRF
   const transfer = (req, res) => {
     // NO hay csrfProtection middleware
     // ...
   }
   ```
   - La transferencia es endpoint crítico sin CSRF
   - **Solución:** Aplicar middleware CSRF

3. **Sin validación de método HTTP**
   - GET también podría ejecutar en algunos contextos
   - **Solución:** Solo POST/PUT/DELETE necesitan token

#### 📝 Recomendación:

```javascript
// MEJORADO: Configuración completa
app.use(session({
  // ...
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS
    sameSite: 'strict', // ← AGREGADO
    maxAge: 3600000
  }
}));

// Proteger endpoint crítico
router.post('/api/transfer', 
  csrfProtection,  // ← AGREGAR
  authenticateUser,
  validateInput,
  transfer
);
```

---

### 4. FILE INCLUSION (LFI) PREVENTION ✅ (85%)

**Implementación:** `backend/src/controllers/vulnerabilityController.js` - `readFile()` function

#### ✅ Lo que está BIEN:

```javascript
// Whitelist estricta de archivos permitidos
const ALLOWED_FILES = ["readme.txt", "public.txt", "config.txt"];

// Validación de extensiones
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".md"];

// Detección de path traversal
const maliciousTraversalList = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
];

// Validación con path.join
const filePath = path.join(BASE_FILES_PATH, decoded);
if (!filePath.startsWith(BASE_FILES_PATH)) {
  return res.status(403).json({ error: "Access denied" });
}
```

**Positivos:**
- ✅ Whitelist de archivos específico
- ✅ Validación de extensiones
- ✅ Path normalization con `path.join()`
- ✅ Detección de múltiples formatos de traversal
- ✅ URL decoding manejado

#### ⚠️ Lo que FALTA:

1. **Redirecciones con null bytes no bloqueadas**
   - `file.txt%00.pdf` podría bypasear en algunos sistemas
   - **Solución:** Agregar validación de null bytes

2. **Sin validación de symlinks**
   - Un symlink podría apuntar fuera del directorio
   - **Solución:** Usar `fs.realpathSync()` con validación

3. **Blacklist de patrones en lugar de whitelist absoluta**
   ```javascript
   const maliciousTraversalList = [
     "../../../etc/passwd", // Específico
     // Pero qué pasa con: "..%2f" o "..%5c"?
   ];
   ```

#### 📝 Recomendación:

```javascript
// MEJORADO: Validación más robusta
function isPathSafe(requestedFile, baseDir) {
  // 1. Verificar null bytes
  if (requestedFile.includes('\0')) {
    return false;
  }

  // 2. Construir y normalizar
  const filePath = path.resolve(baseDir, requestedFile);

  // 3. Resolver symlinks
  try {
    const realPath = fs.realpathSync(filePath);
    // 4. Verificar que sigue siendo dentro del directorio
    return realPath.startsWith(path.resolve(baseDir));
  } catch (e) {
    return false;
  }
}

// Usar whitelist absoluta
if (!ALLOWED_FILES.includes(decoded)) {
  return res.status(404).json({ error: "File not found" });
}
```

---

### 5. INSECURE FILE UPLOAD ✅ (80%)

**Implementación:** `backend/src/config/multer.js`

#### ✅ Lo que está BIEN:

```javascript
// Whitelist de extensiones permitidas
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.txt', '.pdf']);

// Whitelist de MIME types
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'text/plain', 'application/pdf'
]);

// Nombre aleatorio para evitar colisiones y ejecución
const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

// Validación de tamaño
limits: {
  fileSize: 1 * 1024 * 1024 // 1MB
}
```

**Positivos:**
- ✅ Whitelist de extensiones
- ✅ Validación de MIME type
- ✅ Nombre archivo aleatorio
- ✅ Límite de tamaño
- ✅ Validación de directorio

#### ⚠️ Lo que FALTA:

1. **Sin validación de contenido real (magic bytes)**
   - Un atacante puede enviar `.jpg` que es en realidad PHP
   - **Solución:** Usar librería `file-type` para detectar tipo real

2. **Sin validación de dimensiones de imagen**
   - Podría subir imagen malformada o muy grande
   - **Solución:** Usar `jimp` o `sharp` para validar

3. **Sin aislamiento por usuario**
   - Todos los archivos en `/uploads` sin organización
   - **Solución:** Crear `/uploads/{userId}/` por usuario

4. **Servir archivos subidos sin validación**
   ```javascript
   // Podría permitir acceso a archivo de otro usuario
   res.download(file);
   ```

#### 📝 Recomendación:

```javascript
// MEJORADO: Validación completa
const fileType = require('file-type');
const fs = require('fs').promises;

const fileFilter = async (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 1. Validar extensión
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Invalid extension'));
  }

  // 2. Validar MIME type reportado
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Invalid MIME type'));
  }

  // 3. Validar contenido real
  const type = await fileType.fromBuffer(file.buffer);
  if (!type || !ALLOWED_MIME.has(type.mime)) {
    return cb(new Error('File content does not match'));
  }

  // 4. Para imágenes, validar que es válida
  if (type.mime.startsWith('image/')) {
    try {
      await sharp(file.buffer).metadata();
    } catch (e) {
      return cb(new Error('Invalid image'));
    }
  }

  cb(null, true);
};

// Almacenar por usuario
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(UPLOAD_DIR, req.user.id.toString());
    fs.mkdir(userDir, { recursive: true }).then(() => {
      cb(null, userDir);
    }).catch(cb);
  }
});
```

---

### 6. INSECURE CAPTCHA ✅ (70%)

**Implementación:** `backend/src/controllers/captchaController.js`

#### ✅ Lo que está BIEN:

```javascript
// Almacenar con metadata
captchaStore[captchaId] = {
  text: captcha.text.toLowerCase(),
  createdAt: Date.now(),
  attempts: 0,
  used: false
};

// Expiración de 5 minutos
const expired = Date.now() - captcha.createdAt >= 5 * 60 * 1000;

// Límite de intentos
if (captcha.attempts > 3) {
  return res.json({ valid: false, error: 'Too many attempts' });
}

// Validación de single-use
if (captcha.used) {
  return res.json({ valid: false, error: 'already used' });
}
```

**Positivos:**
- ✅ CAPTCHA expira después de 5 minutos
- ✅ Límite de 3 intentos de validación
- ✅ Single-use (una sola validación)
- ✅ ID único por CAPTCHA

#### ⚠️ Lo que FALTA:

1. **CAPTCHA demasiado débil: 4 caracteres**
   ```javascript
   const captcha = svgCaptcha.create({
     size: 4,  // ← MUY DÉBIL
     noise: 1, // ← POCO RUIDO
     color: true
   });
   ```
   - 4 caracteres = 62^4 = ~14 millones combinaciones
   - Con OCR moderno, fácilmente crackeable
   - **Solución:** Usar 6+ caracteres, más ruido

2. **Debug text expuesto en desarrollo**
   ```javascript
   if (process.env.NODE_ENV !== 'production') {
     response.debug = captcha.text; // ← VULNERABILIDAD EN DEV
   }
   ```
   - Devuelve respuesta CAPTCHA en desarrollo
   - **Solución:** Nunca retornar respuesta, ni en dev

3. **Sin persistencia de sesión**
   - Almacenado en memoria (`captchaStore = {}`)
   - Se pierde al reiniciar
   - **Solución:** Usar Redis con TTL

4. **Sin rate limiting en validación**
   - Atacante puede validar múltiples CAPTCHAs sin límite
   - **Solución:** Rate limit por IP/usuario

#### 📝 Recomendación:

```javascript
// MEJORADO: CAPTCHA más robusto
const svgCaptcha = require('svg-captcha');
const redis = require('redis');

const captcha = svgCaptcha.create({
  size: 6,      // ← Aumentar a 6 caracteres
  noise: 3,     // ← Más ruido
  color: true,
  background: '#cccccc', // Fondo menos uniforme
  width: 200,
  height: 60
});

// Guardar en Redis con TTL automático
const captchaId = crypto.randomBytes(16).toString('hex');
await redis.setex(
  `captcha:${captchaId}`,
  300, // 5 minutos TTL
  JSON.stringify({
    text: captcha.text.toLowerCase(),
    attempts: 0,
    used: false
  })
);

// NUNCA retornar el texto, incluso en dev
const response = {
  captchaId,
  captcha: captcha.data
  // NO incluir response.debug
};
```

---

### 7. SQL INJECTION PREVENTION ✅ (90%)

**Implementación:** `backend/src/controllers/authController.js` + `vulnerabilityController.js`

#### ✅ Lo que está BIEN:

```javascript
// Parametrized queries con placeholders (?)
const query = `SELECT * FROM users WHERE username = ?`;
db.query(query, [username], async (err, results) => {
  // ...
});

// En checkUsername
const query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
db.query(query, [username], (err, results) => {
  // ...
});

// Validación estricta de entrada
if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
  return res.json({ exists: false });
}
```

**Positivos:**
- ✅ Parametrized queries (?) en todas partes
- ✅ Validación de formato alfanumérico
- ✅ Sin concatenación de SQL
- ✅ Respuestas genéricas

#### ⚠️ Lo que FALTA:

1. **No hay validación de todas las queries**
   - Necesito verificar productos y otras rutas
   - **Solución:** Auditar todas las queries

2. **Sin logging de consultas sospechosas**
   - No hay detección de intentos de inyección
   - **Solución:** Agregar logging y alertas

#### 📝 Recomendación: Mantener actual (implementación correcta)

---

### 8. BLIND SQL INJECTION MITIGATION ✅ (85%)

**Implementación:** Basado en validación de entrada + respuestas genéricas

#### ✅ Lo que está BIEN:

- Parametrized queries previenen inyección
- Respuestas genéricas no revelan información
- Validación estricta de entrada

#### ⚠️ Gaps:

1. **Sin rate limiting en queries**
   - Un atacante podría intentar time-based blind SQLi lentamente
   - **Solución:** Rate limit global en todas las queries

2. **Sin timeout en queries BD**
   - Query lenta podría usarse para blind SQLi
   - **Solución:** Agregar timeout a nivel aplicación

#### 📝 Recomendación:

```javascript
// MEJORADO: Timeout en queries
const queryWithTimeout = (query, params, timeout = 5000) => {
  return Promise.race([
    new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )
  ]);
};
```

---

## 📊 Tabla Comparativa de Implementación

| Vulnerabilidad          | Implementado | Completitud | Robustez | Escalable |
|-------------------------|--------------|-------------|----------|-----------|
| Brute Force             | ✅           | 70%         | Media    | No        |
| Command Injection       | ✅           | 80%         | Alta     | Sí        |
| CSRF Protection         | ✅           | 75%         | Media    | Sí        |
| File Inclusion (LFI)    | ✅           | 85%         | Alta     | Sí        |
| File Upload             | ✅           | 80%         | Media    | No        |
| Insecure CAPTCHA        | ✅           | 70%         | Baja     | No        |
| SQL Injection           | ✅           | 90%         | Muy Alta | Sí        |
| Blind SQL Injection     | ✅           | 85%         | Alta     | Sí        |

**Promedio:** 81% ✅

---

## 🎯 Prioridades de Mejora

### 🔴 Críticas (implementar inmediatamente):

1. **Persistencia en Redis**
   - Brute force: Contador pierde reinicio
   - CAPTCHA: Datos se pierden
   - **Impacto:** Sistema no funciona en múltiples instancias

2. **CSRF en endpoint transfer**
   - Transferencia sin protección CSRF
   - **Impacto:** Crítico para funcionalidad

3. **Validación de contenido de archivo**
   - Magic bytes no se verifican
   - **Impacto:** Bypass de extensión fácil

### 🟡 Altas (implementar pronto):

4. **CAPTCHA más fuerte**
   - 4 caracteres es débil
   - **Impacto:** Fácilmente crackeable

5. **Rate limiting en todas las queries**
   - Sin protección blind SQLi lento
   - **Impacto:** Vulnerabilidad explotable

6. **Timeout de comandos y queries**
   - Sin timeout podría colgar

### 🟢 Bajas (mejoras):

7. **Aislamiento de uploads por usuario**
   - Seguridad adicional
   - **Impacto:** Organizacional

---

## 📝 Conclusiones

### ✅ Puntos Fuertes del Trabajo:

1. Los estudiantes **entienden los conceptos** de seguridad
2. **Implementaron protecciones funcionales** contra 8 vulnerabilidades
3. **Validación de entrada** es generalmente buena
4. **Parametrized queries** usadas correctamente

### ⚠️ Áreas de Mejora:

1. Falta **persistencia y escalabilidad** (Redis)
2. Algunos **endpoints críticos no están protegidos** (CSRF en transfer)
3. **Validación de contenido** necesita mejorar (magic bytes)
4. **Falta rate limiting** en algunas áreas (queries, CAPTCHA validate)

### 🎓 Recomendaciones Educativas:

1. Estudiar **persistencia de datos** en seguridad
2. Practicar con **Redis para rate limiting**
3. Aprender sobre **magic bytes** y validación de archivos
4. Implementar **WAF (Web Application Firewall)** básico

---

## 📋 Checklist de Correcciones Sugeridas

- [ ] Migrar contadores a Redis con TTL
- [ ] Agregar CSRF al endpoint `/transfer`
- [ ] Implementar validación de magic bytes
- [ ] Aumentar complejidad de CAPTCHA (6 caracteres)
- [ ] Rate limit en verificación de CAPTCHA
- [ ] Rate limit en queries BD
- [ ] Timeout de comandos y queries
- [ ] Aislamiento de uploads por usuario
- [ ] Eliminar debug text de CAPTCHA en dev
- [ ] Agregar logging de intentos sospechosos

---

**Documento generado:** Diciembre 2025  
**Versión:** 1.0 - Revisión Inicial  
**Estado:** Listo para compartir con estudiantes
