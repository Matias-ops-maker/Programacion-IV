# 🔐 Buenas Prácticas de Seguridad

**Documento:** Patrones de seguridad aplicables más allá de este proyecto  
**Fecha:** 2 de diciembre de 2025  
**Objetivo:** Proporcionar principios reutilizables para cualquier proyecto web

---

## 📋 Tabla de Contenidos

1. [Autenticación y Sesiones](#autenticación-y-sesiones)
2. [Validación de Entrada](#validación-de-entrada)
3. [Salida Segura](#salida-segura)
4. [Manejo de Archivos](#manejo-de-archivos)
5. [Gestión de Bases de Datos](#gestión-de-bases-de-datos)
6. [Control de Acceso](#control-de-acceso)
7. [Configuración Segura](#configuración-segura)
8. [Testing de Seguridad](#testing-de-seguridad)

---

## 1. Autenticación y Sesiones

### ✅ Principio 1: Rate Limiting en Endpoints de Autenticación

**¿Por qué?** Previene ataques de fuerza bruta y diccionario

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');

// PATRÓN SEGURO
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos
  keyGenerator: (req) => req.ip + ':' + req.body.username,
  handler: (req, res) => {
    // Logging de seguridad
    console.warn(`Brute force attempt: ${req.ip} - ${req.body.username}`);
    res.status(429).json({ error: 'Too many attempts' });
  }
});

app.post('/login', authLimiter, authenticateController);
```

### ✅ Principio 2: CAPTCHA después de N Intentos

**¿Por qué?** Detiene bots pero permite usuarios legítimos

```javascript
// PATRÓN SEGURO
async function login(req, res) {
  const { username, password, captchaToken } = req.body;
  
  // Contar intentos fallidos
  const failedAttempts = await getFailedAttempts(username, '15min');
  
  if (failedAttempts >= 3) {
    // Requerir CAPTCHA
    if (!captchaToken || !validateCaptcha(captchaToken)) {
      return res.status(403).json({ 
        error: 'CAPTCHA required',
        captchaRequired: true 
      });
    }
  }
  
  // Autenticar...
}
```

### ✅ Principio 3: Mensajes de Error Genéricos

**¿Por qué?** Evita que atacantes enumeren usuarios válidos

```javascript
// ❌ INSEGURO
if (!user) return res.json({ error: 'User not found' });
if (password !== user.password) return res.json({ error: 'Invalid password' });

// ✅ SEGURO
const user = await User.findByUsername(username);
const valid = user && bcrypt.compareSync(password, user.passwordHash);

if (!valid) {
  // Mismo mensaje en ambos casos
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

### ✅ Principio 4: Sesiones Seguras

**¿Por qué?** Protege cookies de acceso JavaScript

```javascript
// PATRÓN SEGURO
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // Solo HTTPS
    httpOnly: true,      // ✅ No accesible desde JS (previene XSS)
    sameSite: 'strict',  // ✅ No se envía en cross-site (previene CSRF)
    maxAge: 1000 * 60 * 60  // 1 hora
  }
}));
```

### ✅ Principio 5: Hash de Contraseñas

**¿Por qué?** Nunca almacenar contraseñas en texto plano

```javascript
const bcrypt = require('bcrypt');

// PATRÓN SEGURO
async function createUser(username, password) {
  // Hash con salt aleatorio (10 rondas por defecto)
  const passwordHash = await bcrypt.hash(password, 10);
  
  await User.create({
    username,
    passwordHash  // ← Nunca la contraseña original
  });
}

// Validar contraseña
async function validatePassword(rawPassword, hash) {
  return await bcrypt.compare(rawPassword, hash);
}
```

---

## 2. Validación de Entrada

### ✅ Principio 1: Whitelist > Blacklist

**¿Por qué?** Blacklists son fáciles de eludir

```javascript
// ❌ INSEGURO (Blacklist)
if (!username.includes(';') && !username.includes('--')) {
  // Valida... ¡pero hay 100 formas de inyectar!
}

// ✅ SEGURO (Whitelist)
const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
if (!isValid) {
  return res.status(400).json({ error: 'Invalid username' });
}
```

### ✅ Principio 2: Validar Tipo y Formato

**¿Por qué?** Los datos pueden no ser lo que parecen

```javascript
// PATRÓN SEGURO
function validateInput(data) {
  const schema = {
    email: 'string|email',
    age: 'number|min:0|max:120',
    role: 'enum:user,admin,moderator'
  };
  
  // Usar librería de validación (Joi, Yup, etc)
  const { error, value } = schema.validate(data);
  
  if (error) {
    return res.status(400).json({ 
      error: error.details.map(d => d.message) 
    });
  }
  
  return value;
}
```

### ✅ Principio 3: Validar Longitud

**¿Por qué?** Previene buffer overflows y ataques de memoria

```javascript
// PATRÓN SEGURO
const MAX_USERNAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_BIO_LENGTH = 5000;

if (username.length > MAX_USERNAME_LENGTH) {
  return res.status(400).json({ error: 'Username too long' });
}
```

### ✅ Principio 4: Encoded vs Sanitized

**¿Por qué?** Diferentes contextos necesitan diferentes defensas

```javascript
// Para datos en BD (usar parametrized queries)
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);  // ← El DB escapa automáticamente

// Para mostrar en HTML
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Para URLs
const params = new URLSearchParams({ search: userInput });
const url = `https://api.example.com?${params}`;  // Automático
```

---

## 3. Salida Segura

### ✅ Principio 1: Escapar HTML en Templates

**¿Por qué?** Previene Cross-Site Scripting (XSS)

```jsx
// ❌ INSEGURO (React)
<div>{userComment}</div>  // Si userComment = "<img src=x onerror=alert('XSS')>"

// ✅ SEGURO (React escapa por defecto)
// React ya escapa automáticamente
<div>{userComment}</div>

// Si necesitas HTML seguro (usar librería especializada)
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(htmlContent);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

### ✅ Principio 2: Content Security Policy (CSP)

**¿Por qué?** Define qué scripts/recursos se pueden ejecutar

```javascript
// PATRÓN SEGURO
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",                    // Solo scripts del mismo origen
    "script-src 'self' cdn.example.com",     // Scripts permitidos
    "style-src 'self' 'unsafe-inline'",      // CSS permitido
    "img-src 'self' data: https:",           // Imágenes
    "font-src 'self'",                       // Fuentes
    "connect-src 'self' api.example.com",    // APIs permitidas
    "frame-ancestors 'none'",                // No puede embeberse
    "base-uri 'self'",                       // Base URL
    "form-action 'self'"                     // Dónde se envían formularios
  ].join('; '));
  next();
});
```

### ✅ Principio 3: Headers de Seguridad

**¿Por qué?** Proporciona protecciones adicionales

```javascript
// PATRÓN SEGURO - Middleware de seguridad
const helmet = require('helmet');

app.use(helmet());  // Establece automáticamente:

// Manualmente si es necesario:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');      // No adivinar MIME
  res.setHeader('X-Frame-Options', 'DENY');                 // No iframes
  res.setHeader('X-XSS-Protection', '1; mode=block');       // Protección XSS
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  next();
});
```

---

## 4. Manejo de Archivos

### ✅ Principio 1: Nunca Confiar en el Nombre del Archivo

**¿Por qué?** Los atacantes pueden cambiar extensiones

```javascript
// PATRÓN SEGURO
const crypto = require('crypto');
const path = require('path');

async function saveUploadedFile(file, userId) {
  // 1. Generar nombre aleatorio
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(file.originalname);
  const filename = `${uniqueId}${ext}`;
  
  // 2. Validar el contenido real (magic bytes)
  const detectedType = await fileType.fromBuffer(file.buffer);
  if (!isAllowedMimeType(detectedType.mime)) {
    throw new Error('Invalid file type');
  }
  
  // 3. Guardar en directorio por usuario
  const userDir = path.join(UPLOADS_DIR, userId);
  fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
  
  // 4. Guardar con permisos restrictivos
  fs.writeFileSync(
    path.join(userDir, filename),
    file.buffer,
    { mode: 0o644 }  // No ejecutable
  );
  
  return filename;
}
```

### ✅ Principio 2: Validar Extensión en Whitelist

**¿Por qué?** Pocos tipos deberían estar permitidos

```javascript
// PATRÓN SEGURO
const ALLOWED_EXTENSIONS = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf'
  // NO .exe, .sh, .php, .bat, etc
};

function validateFileExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  if (!(ext in ALLOWED_EXTENSIONS)) {
    throw new Error(`Extension not allowed: ${ext}`);
  }
  
  return ext;
}
```

### ✅ Principio 3: Limitar Tamaño de Archivo

**¿Por qué?** Previene ataques de negación de servicio (DoS)

```javascript
// PATRÓN SEGURO
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024  // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.size > 5 * 1024 * 1024) {
      cb(new Error('File too large'));
    } else {
      cb(null, true);
    }
  }
});
```

### ✅ Principio 4: Nunca Ejecutar Archivos Subidos

**¿Por qué?** Arquitectura web 101

```javascript
// ❌ INSEGURO
app.use(express.static('/uploads'));  // Cualquier cosa se ejecuta

// ✅ SEGURO - Servir como descarga
app.get('/api/download/:fileId', async (req, res) => {
  const file = await File.findById(req.params.fileId);
  
  // Validar acceso
  if (file.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Descargar como adjunto (no ejecutar)
  res.download(file.path, file.originalName);
});
```

---

## 5. Gestión de Bases de Datos

### ✅ Principio 1: Siempre Usar Parametrized Queries

**¿Por qué?** Única defensa confiable contra SQL Injection

```javascript
// ❌ NUNCA hacer esto
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// ✅ SIEMPRE hacer esto
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// Con ORM (que lo hace automáticamente)
const user = await User.findById(userId);  // ← Parametrizado internamente
```

### ✅ Principio 2: Principio de Mínimo Privilegio

**¿Por qué?** Limita daño si las credenciales se comprometen

```javascript
// PATRÓN SEGURO
// BD:
CREATE USER 'app_read'@'localhost' IDENTIFIED BY '...';
GRANT SELECT ON database.* TO 'app_read'@'localhost';

CREATE USER 'app_write'@'localhost' IDENTIFIED BY '...';
GRANT SELECT, INSERT, UPDATE ON database.* TO 'app_write'@'localhost';

// Aplicación:
const readPool = mysql.createPool({ user: 'app_read', ... });
const writePool = mysql.createPool({ user: 'app_write', ... });

// En código:
const user = await readPool.query('SELECT * FROM users WHERE id = ?', [id]);
await writePool.execute('UPDATE users SET ... WHERE id = ?', [id]);
```

### ✅ Principio 3: Encriptar Datos Sensibles

**¿Por qué?** Protege datos en reposo

```javascript
const crypto = require('crypto');

// PATRÓN SEGURO
class SensitiveData {
  static encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  static decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Usar:
const socialSecurity = SensitiveData.encrypt(ssn);
await User.create({ socialSecurityEncrypted: socialSecurity });
```

### ✅ Principio 4: Logging de Acceso a Datos

**¿Por qué?** Detectar acceso no autorizado

```javascript
// PATRÓN SEGURO
class AuditLog {
  static async log(action, userId, resource, result) {
    await AuditLog.create({
      timestamp: new Date(),
      action,                // 'READ', 'UPDATE', 'DELETE'
      userId,
      resource,              // Qué se accedió
      resourceId,
      ip: req.ip,
      result,                // 'SUCCESS', 'DENIED'
      reason: result.message // Por qué si falló
    });
  }
}

// Usar:
try {
  const data = await db.query('SELECT * FROM sensitive WHERE id = ?', [id]);
  await AuditLog.log('READ', userId, 'sensitive_data', { message: 'SUCCESS' });
} catch (error) {
  await AuditLog.log('READ', userId, 'sensitive_data', { message: error.message });
}
```

---

## 6. Control de Acceso

### ✅ Principio 1: Autenticación vs Autorización

**¿Por qué?** Conceptos distintos que se implementan juntos

```javascript
// PATRÓN SEGURO
// 1. Autenticación: ¿Eres quién dices ser?
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // ← Ahora sabemos quién es
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// 2. Autorización: ¿Se te permite hacer esto?
function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usar:
app.delete('/api/users/:id', 
  authenticate,
  authorize(['admin']),  // ← Solo admins pueden eliminar
  deleteUserController
);
```

### ✅ Principio 2: Verificar Pertenencia (Object Level)

**¿Por qué?** Un usuario no puede acceder datos de otro

```javascript
// PATRÓN SEGURO
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  
  // ✅ CRÍTICO: Verificar que el order pertenece al usuario
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(order);
});

// Aplicar al eliminar también
app.delete('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  await order.destroy();
  res.json({ success: true });
});
```

### ✅ Principio 3: Role-Based Access Control (RBAC)

**¿Por qué?** Escalable para aplicaciones complejas

```javascript
// PATRÓN SEGURO
const permissions = {
  user: {
    'orders:read': ['own'],        // Solo propios
    'orders:create': true,         // Cualquiera
    'users:read': false            // No permitido
  },
  moderator: {
    'orders:read': ['own', 'others'],  // Propios y ajenos
    'orders:update': ['others'],
    'users:read': ['all']
  },
  admin: {
    'orders:read': ['all'],        // Todo
    'orders:update': ['all'],
    'users:read': ['all'],
    'users:delete': ['all']
  }
};

function canAccess(role, action, resource) {
  const rolePerms = permissions[role];
  if (!rolePerms) return false;
  
  const actionPerms = rolePerms[action];
  if (actionPerms === false) return false;
  if (actionPerms === true) return true;
  
  // Validar a nivel de recurso
  return actionPerms.includes(resource);
}
```

---

## 7. Configuración Segura

### ✅ Principio 1: Variables de Entorno para Secretos

**¿Por qué?** Nunca poner credenciales en código

```bash
# .env (gitignored)
DB_PASSWORD=super_secret_123
JWT_SECRET=my_jwt_secret
API_KEY=external_api_key
ENCRYPTION_KEY=encryption_secret

# .env.example (committeado)
DB_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME
API_KEY=CHANGE_ME
ENCRYPTION_KEY=CHANGE_ME
```

```javascript
// config/database.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // ← De variables, no hardcoded
  database: process.env.DB_NAME
});
```

### ✅ Principio 2: HTTPS por Defecto

**¿Por qué?** Encripta todo en tránsito

```javascript
// server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS server running on 443');
});

// Redirigir HTTP a HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### ✅ Principio 3: CORS Restrictivo

**¿Por qué?** No todas las apps deberían acceder tu API

```javascript
// PATRÓN SEGURO
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://example.com',
  'https://www.example.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### ✅ Principio 4: Deshabilitar Funcionalidades Innecesarias

**¿Por qué?** Menos código = menos superficie de ataque

```javascript
// PATRÓN SEGURO
app.disable('x-powered-by');  // No revelar que es Express

// Limitar body
app.use(express.json({ limit: '10kb' }));

// No permitir query strings complejos
app.use(express.urlencoded({ extended: false }));

// Deshabilitar métodos HTTP innecesarios
app.use((req, res, next) => {
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});
```

---

## 8. Testing de Seguridad

### ✅ Principio 1: Testing Unitario de Validaciones

**¿Por qué?** Validaciones son puntos críticos

```javascript
// tests/validation.test.js
const { validateUsername, validateEmail } = require('../validators');

describe('Input Validation', () => {
  it('should reject usernames with special characters', () => {
    expect(() => validateUsername("admin'; DROP TABLE users;")).toThrow();
  });
  
  it('should accept valid usernames', () => {
    expect(validateUsername('john_doe')).toBe('john_doe');
  });
  
  it('should reject emails with incorrect format', () => {
    expect(() => validateEmail('not_an_email')).toThrow();
  });
});
```

### ✅ Principio 2: Testing de Autorización

**¿Por qué?** Evitar escalación de privilegios

```javascript
// tests/authorization.test.js
describe('Authorization', () => {
  it('should prevent user from accessing other user data', async () => {
    const user1 = await createUser('user1', 'pass1');
    const user2 = await createUser('user2', 'pass2');
    
    const response = await request(app)
      .get(`/api/profile/${user2.id}`)
      .set('Authorization', `Bearer ${user1.token}`);
    
    expect(response.status).toBe(403);
  });
  
  it('should allow admin to access any user', async () => {
    const admin = await createUser('admin', 'pass', 'admin');
    const user = await createUser('user', 'pass');
    
    const response = await request(app)
      .get(`/api/profile/${user.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    
    expect(response.status).toBe(200);
  });
});
```

### ✅ Principio 3: Testing de Inyección

**¿Por qué?** Validar que protecciones funcionan

```javascript
// tests/injection.test.js
describe('Injection Prevention', () => {
  it('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: "admin' OR '1'='1",
        password: 'anything'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
  
  it('should prevent command injection in image processing', async () => {
    const response = await request(app)
      .post('/api/process-image')
      .set('Authorization', `Bearer ${token}`)
      .send({
        filename: 'image.jpg; rm -rf /'
      });
    
    expect(response.status).toBe(400);
  });
});
```

### ✅ Principio 4: Security Scanning Automático

**¿Por qué?** Detectar vulnerabilidades conocidas

```bash
# package.json
{
  "scripts": {
    "test:security": "npm audit && snyk test && bandit -r src/",
    "lint:security": "eslint --ext .js src/ && npm run lint:secrets"
  }
}

# .github/workflows/security.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm audit
      - run: npm run test:security
```

---

## 📊 Resumen: Checklist de Seguridad

### Autenticación
- [ ] Rate limiting en login
- [ ] CAPTCHA después de N intentos
- [ ] Mensajes de error genéricos
- [ ] Contraseñas hasheadas con bcrypt
- [ ] Sesiones httpOnly y secure

### Entrada
- [ ] Whitelist de caracteres permitidos
- [ ] Validación de tipo y formato
- [ ] Límites de longitud
- [ ] Validación de extensiones (archivos)
- [ ] Magic bytes checking (archivos)

### Bases de Datos
- [ ] Parametrized queries (100%)
- [ ] Principio de mínimo privilegio
- [ ] Encriptación de datos sensibles
- [ ] Audit logging

### Control de Acceso
- [ ] Autenticación en todos los endpoints
- [ ] Verificación de propiedad (object-level)
- [ ] Autorización basada en roles
- [ ] Testeo de escalación de privilegios

### Configuración
- [ ] Variables de entorno para secretos
- [ ] HTTPS obligatorio
- [ ] CORS restrictivo
- [ ] Headers de seguridad

### Testing
- [ ] Tests de validación
- [ ] Tests de autorización
- [ ] Tests de inyección
- [ ] Scanning automático de vulnerabilidades

---

**Documento generado:** 2 de diciembre de 2025  
**Versión:** 1.0

