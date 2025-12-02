# 🔒 Documentación de Vulnerabilidades - WebApp-Seguridad-Prog4

## 📋 Contenido
1. [Vulnerabilidad 1: Brute Force](#1-brute-force-attack)
2. [Vulnerabilidad 2: Command Injection](#2-command-injection)
3. [Vulnerabilidad 3: CSRF Protection](#3-csrf-cross-site-request-forgery)
4. [Vulnerabilidad 4: File Inclusion](#4-file-inclusion-attack)
5. [Vulnerabilidad 5: File Upload](#5-insecure-file-upload)
6. [Vulnerabilidad 6: Insecure CAPTCHA](#6-insecure-captcha)
7. [Vulnerabilidad 7: SQL Injection](#7-sql-injection)
8. [Vulnerabilidad 8: Blind SQL Injection](#8-blind-sql-injection)

---

## 1. Brute Force Attack

### 🎯 ¿Qué es?
Un ataque de fuerza bruta intenta adivinar contraseñas o credenciales mediante intentos repetidos y automatizados. Sin protección, un atacante puede hacer miles de intentos por segundo.

### ⚠️ Impacto
- **Criticidad:** 🔴 ALTA
- **Riesgo:** Acceso no autorizado a cuentas de usuario
- **Alcance:** Todos los usuarios de la aplicación
- **Consecuencias:** Robo de identidad, acceso a datos sensibles, suplantación

### 🔍 Cómo Funciona el Ataque

```
Atacante
   ↓
Intenta: usuario=admin, password=123456
   ↓ Rechazado
Intenta: usuario=admin, password=123457
   ↓ Rechazado
Intenta: usuario=admin, password=123458
   ↓ Rechazado
... (miles de intentos más)
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Sin rate limiting
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Sin protección: puedes intentar login infinitas veces
  const user = await User.findByUsername(username);
  
  if (user && await user.checkPassword(password)) {
    res.json({ token: generateToken(user) });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**Problema:** Un atacante puede hacer 1000s de intentos sin límite.

### 🛡️ Solución

**Implementación de Rate Limiting:**

```javascript
// ✅ SEGURO: Con rate limiting
const rateLimit = require('express-rate-limit');

// Limitar intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RateLimitStore(), // Usar BD para persistencia
  skip: (req, res) => {
    // No aplicar límite a IPs confiables
    return req.ip === '127.0.0.1';
  }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password, captcha } = req.body;
  
  // Contador de intentos fallidos
  const attempts = await LoginAttempt.count({
    where: { username, success: false },
    include: [{ where: { createdAt: { $gte: 15 minutos atrás } } }]
  });
  
  if (attempts > 3) {
    // Requerir CAPTCHA después de 3 intentos
    if (!captcha || !validateCaptcha(captcha)) {
      return res.status(400).json({ error: 'CAPTCHA requerido' });
    }
  }
  
  const user = await User.findByUsername(username);
  
  if (user && await user.checkPassword(password)) {
    await LoginAttempt.create({ username, success: true });
    res.json({ token: generateToken(user) });
  } else {
    await LoginAttempt.create({ username, success: false });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/login', loginLimiter, authController.login);
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Intentos permitidos** | Ilimitados | 5 en 15 minutos |
| **Delay** | Ninguno | Exponencial |
| **CAPTCHA** | No | Sí, después de 3 intentos |
| **Bloqueo temporal** | No | Sí, por IP |
| **Logging** | Limitado | Completo con alertas |

### 🔐 Mejores Prácticas

1. **Rate Limiting:** Máximo 5 intentos en 15 minutos
2. **CAPTCHA:** Requerido después de 3 intentos fallidos
3. **Bloqueo de IP:** Temporal después de múltiples fallos
4. **Logging:** Registrar todos los intentos fallidos
5. **Notificaciones:** Alertar al usuario de intentos sospechosos
6. **Tiempos exponenciales:** Aumentar delay con cada intento

---

## 2. Command Injection

### 🎯 ¿Qué es?
Cuando una aplicación ejecuta comandos del sistema sin validar la entrada del usuario. El atacante puede inyectar comandos arbitrarios.

### ⚠️ Impacto
- **Criticidad:** 🔴 CRÍTICA
- **Riesgo:** Control total del servidor
- **Alcance:** Toda la aplicación e infraestructura
- **Consecuencias:** Robo de datos, eliminación de archivos, instalación de malware

### 🔍 Cómo Funciona el Ataque

```bash
# Input normal
ls /uploads

# Input malicioso
ls /uploads; rm -rf /

# El servidor ejecuta ambos comandos
ls /uploads
rm -rf /  ← Elimina TODO
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Ejecuta comandos sin validación
const { exec } = require('child_process');

app.post('/api/process-file', (req, res) => {
  const { filename } = req.body;
  
  // Concatenación directa = inyección posible
  exec(`convert ${filename} -resize 100x100 ${filename}.thumb.jpg`, 
    (error, stdout, stderr) => {
      if (error) return res.status(500).json({ error });
      res.json({ message: 'File processed' });
    }
  );
});

// Atacante envía:
// filename: "image.jpg; rm -rf /uploads; echo "
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Usar métodos seguros sin shell
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

app.post('/api/process-file', validateUpload, (req, res) => {
  const { filename } = req.body;
  
  // 1. Validar nombre de archivo
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // 2. Validar que el archivo existe y está en ubicación segura
  const filePath = path.join('/uploads', filename);
  const uploadsDir = path.resolve('/uploads');
  
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // 3. Usar execFile en lugar de exec (sin shell)
  // Los argumentos se pasan como array
  execFile('convert', 
    [
      filePath,
      '-resize', '100x100',  // Los argumentos NO se concatenan
      `${filePath}.thumb.jpg`
    ],
    { timeout: 5000 }, // Timeout de 5 segundos
    (error, stdout, stderr) => {
      if (error) {
        console.error('Processing error:', error);
        return res.status(500).json({ error: 'Processing failed' });
      }
      res.json({ message: 'File processed', filename: path.basename(filePath) });
    }
  );
});
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Método** | `exec()` | `execFile()` |
| **Shell activado** | Sí | No |
| **Concatenación** | Sí | No |
| **Validación entrada** | No | Sí |
| **Path traversal** | Permitido | Bloqueado |
| **Timeout** | No | Sí |

### 🔐 Mejores Prácticas

1. **Nunca usar `exec()`:** Usar `execFile()` o `spawn()`
2. **Whitelist de archivos:** Solo procesar nombres válidos
3. **Path traversal prevention:** Validar con `path.resolve()`
4. **Argumentos como array:** No concatenar strings
5. **Timeout:** Siempre establecer límite de tiempo
6. **Validación de entrada:** Whitelist, no blacklist

---

## 3. CSRF (Cross-Site Request Forgery)

### 🎯 ¿Qué es?
Un ataque donde un sitio malicioso engaña al navegador para hacer peticiones a otro sitio en nombre del usuario autenticado.

### ⚠️ Impacto
- **Criticidad:** 🔴 ALTA
- **Riesgo:** Acciones no autorizadas en nombre del usuario
- **Alcance:** Acciones que el usuario podría hacer
- **Consecuencias:** Cambio de contraseña, transferencias, eliminación de datos

### 🔍 Cómo Funciona el Ataque

```html
<!-- Sitio malicioso: evil.com -->
<img src="http://bank.com/transfer?to=attacker&amount=1000" />

<!-- El navegador automáticamente envía cookies del usuario
     La acción se ejecuta con credenciales del usuario -->
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Sin token CSRF
app.post('/api/transfer', async (req, res) => {
  const { toAccount, amount } = req.body;
  
  // Nada valida que la petición viene del sitio legítimo
  const transfer = await Transfer.create({
    fromAccount: req.user.id,
    toAccount,
    amount
  });
  
  res.json({ success: true, transfer });
});

// Atacante solo necesita:
// fetch('http://localhost:5000/api/transfer', {
//   method: 'POST',
//   credentials: 'include',
//   body: JSON.stringify({ toAccount: 'attacker', amount: 9999 })
// })
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Con protección CSRF
const csrf = require('csurf');
const session = require('express-session');

// Middleware CSRF
const csrfProtection = csrf({ cookie: false }); // Usa session, no cookie

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,        // Solo HTTPS
    httpOnly: true,      // No accesible desde JavaScript
    sameSite: 'strict'   // No se envía en peticiones cross-site
  }
}));

// Generar token para formularios
app.get('/api/form-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Proteger acciones sensibles
app.post('/api/transfer', csrfProtection, validateInput, async (req, res) => {
  // El middleware automáticamente valida el token CSRF
  const { toAccount, amount } = req.body;
  
  const transfer = await Transfer.create({
    fromAccount: req.user.id,
    toAccount,
    amount
  });
  
  res.json({ success: true, transfer });
});

// Frontend debe incluir el token
// <form method="POST" action="/api/transfer">
//   <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
//   <input name="toAccount" />
//   <input name="amount" />
// </form>
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Token CSRF** | No | Sí |
| **Storage token** | - | Session (httpOnly) |
| **SameSite Cookie** | No | Strict |
| **HTTPOnly** | No | Sí |
| **HTTPS requerido** | No | Sí |
| **Validación** | No | Automática |

### 🔐 Mejores Prácticas

1. **Token único por sesión:** Generar y validar siempre
2. **Almacenar en session:** No en cookie visible
3. **SameSite=Strict:** Máxima protección
4. **HTTPOnly:** Evitar acceso desde JavaScript
5. **HTTPS:** Requerido en producción
6. **Validación obligatoria:** En todas las acciones sensibles

---

## 4. File Inclusion Attack

### 🎯 ¿Qué es?
Cuando la aplicación permite acceder a archivos basado en entrada del usuario sin validar. Un atacante puede leer archivos sensibles o ejecutar código.

### ⚠️ Impacto
- **Criticidad:** 🔴 ALTA
- **Riesgo:** Lectura de archivos sensibles
- **Alcance:** Sistema de archivos del servidor
- **Consecuencias:** Exposición de credenciales, código fuente, bases de datos

### 🔍 Cómo Funciona el Ataque

```
URL: /file?path=../../etc/passwd
URL: /file?path=../../../.env
URL: /file?path=../../database.sql
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Path traversal
app.get('/api/file/:name', (req, res) => {
  const { name } = req.params;
  
  // Directamente usa el input del usuario
  const filePath = `/uploads/${name}`;
  
  res.download(filePath);
});

// Atacante accede:
// GET /api/file/../../etc/passwd
// GET /api/file/../../.env
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Validación de ruta
const path = require('path');
const fs = require('fs');

app.get('/api/file/:name', validateUser, (req, res) => {
  const { name } = req.params;
  
  // 1. Validar formato de nombre
  if (!name || name.includes('.') || name.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // 2. Construir ruta segura
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const filePath = path.resolve(uploadsDir, name);
  
  // 3. Validar que está dentro del directorio permitido
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // 4. Validar que existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // 5. Validar que es archivo (no directorio)
  if (!fs.statSync(filePath).isFile()) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // 6. Validar tipo de archivo
  const allowedExtensions = ['.pdf', '.doc', '.jpg', '.png'];
  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    return res.status(403).json({ error: 'File type not allowed' });
  }
  
  res.download(filePath);
});

// O usar un mapping seguro
const FILES = {
  'document1': '/uploads/report_2024.pdf',
  'document2': '/uploads/invoice.pdf',
  // Etc.
};

app.get('/api/file/:id', (req, res) => {
  const filePath = FILES[req.params.id];
  
  if (!filePath) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Validación entrada** | No | Sí |
| **Path normalization** | No | Sí |
| **Boundary check** | No | Sí |
| **Whitelist archivos** | No | Sí |
| **Validar tipo** | No | Sí |
| **Mapeo seguro** | - | Sí |

### 🔐 Mejores Prácticas

1. **Path.resolve():** Normalizar rutas
2. **Startswith check:** Validar dentro de directorio permitido
3. **Whitelist tipos:** Solo extensiones permitidas
4. **Mapping seguro:** Usar IDs en lugar de nombres
5. **Validar existencia:** Comprobar archivo existe
6. **No seguir symlinks:** Usar `fs.realpathSync()`

---

## 5. Insecure File Upload

### 🎯 ¿Qué es?
Cuando la aplicación permite subir archivos sin validar su tipo, tamaño o contenido. Un atacante puede subir malware o código ejecutable.

### ⚠️ Impacto
- **Criticidad:** 🔴 CRÍTICA
- **Riesgo:** Ejecución de código, malware
- **Alcance:** Servidor y otros usuarios
- **Consecuencias:** Compromiso total del servidor

### 🔍 Cómo Funciona el Ataque

```
1. Atacante crea: malware.php (código malicioso)
2. Lo disfraza como: malware.php.jpg
3. Lo sube a la aplicación
4. Accede directamente: /uploads/malware.php
5. Código se ejecuta en el servidor
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Sin validación
const multer = require('multer');

const upload = multer({ 
  dest: '/uploads' 
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  // Solo se renombra al archivo
  res.json({ 
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// Atacante sube:
// - shell.php
// - backdoor.aspx
// - malware.exe
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Validación completa
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fileType = require('file-type');

// Configuración de upload segura
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Subdirectorio por usuario para aislar archivos
    const userDir = path.join('/uploads', req.user.id.toString());
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre aleatorio, mantener extensión
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// Validación de archivo
const fileFilter = async (req, file, cb) => {
  // 1. Validar tamaño
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return cb(new Error('File size exceeds 5MB'));
  }
  
  // 2. Validar tipo MIME
  const ALLOWED_MIMES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword'
  ];
  
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'));
  }
  
  // 3. Validar extensión
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('File extension not allowed'));
  }
  
  // 4. Validar contenido real del archivo
  // (Usar librería file-type para detectar tipo real)
  const type = await fileType.fromBuffer(file.buffer);
  
  if (type && !ALLOWED_MIMES.includes(type.mime)) {
    return cb(new Error('File content does not match extension'));
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

app.post('/api/upload', 
  authenticateUser,
  upload.single('file'), 
  validateUploadResult,
  (req, res) => {
    // Guardar info de archivo en BD
    const uploadRecord = {
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    
    // No servir archivos directamente
    // Usar un endpoint que valida acceso
    res.json({
      fileId: uploadRecord.id,
      message: 'File uploaded successfully'
    });
  }
);

// Endpoint seguro para descargar
app.get('/api/file/:fileId', async (req, res) => {
  const file = await File.findById(req.params.fileId);
  
  if (!file || file.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const filePath = path.join('/uploads', req.user.id.toString(), file.storedName);
  
  // Validar que existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, file.originalName);
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Upload failed' });
});
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Validación tamaño** | No | Sí (5MB) |
| **Validación MIME** | No | Sí |
| **Validación extensión** | No | Sí |
| **Validación contenido** | No | Sí |
| **Nombre aleatorio** | No | Sí |
| **Aislamiento por usuario** | No | Sí |
| **Validación acceso** | No | Sí |
| **Servir en /uploads** | Sí (peligroso) | No |

### 🔐 Mejores Prácticas

1. **Validar tamaño:** Máximo 5-10MB
2. **Validar MIME:** Whitelist tipos permitidos
3. **Validar extensión:** Whitelist extensiones
4. **Validar contenido:** Usar librería para detectar tipo real
5. **Nombre aleatorio:** No mantener original
6. **Almacenar en BD:** Mapeo de archivo a usuario
7. **No servir públicamente:** Validar acceso
8. **Permisos 644:** Nunca 777

---

## 6. Insecure CAPTCHA

### 🎯 ¿Qué es?
Un CAPTCHA débil o predecible que puede ser resuelto automáticamente o reutilizado. Derrota el propósito de verificar humanos.

### ⚠️ Impacto
- **Criticidad:** 🟡 MEDIA
- **Riesgo:** Automatización de ataques
- **Alcance:** Ataques de fuerza bruta, spam
- **Consecuencias:** Bypass de protecciones

### 🔍 Cómo Funciona el Ataque

```
1. CAPTCHA predecible: Siempre "12345"
2. CAPTCHA reutilizable: El mismo token múltiples veces
3. CAPTCHA sin expiración: Se puede usar después de horas
4. CAPTCHA débil: Sólo números fáciles de adivinar
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: CAPTCHA débil
const captcha = require('svg-captcha');

app.get('/api/captcha', (req, res) => {
  // CAPTCHA simple predecible
  const cap = captcha.create({
    noise: 0,          // Sin ruido
    size: 4,           // Solo 4 caracteres
    ignoreChars: '0il1Lo',
    color: false,      // Blanco y negro
    background: '#ffffff'
  });
  
  req.session.captchaText = cap.text;
  
  res.type('svg');
  res.send(cap.data);
});

app.post('/api/login', (req, res) => {
  const { username, password, captcha } = req.body;
  
  // CAPTCHA nunca expira
  // Se puede reutilizar
  if (captcha !== req.session.captchaText) {
    return res.status(400).json({ error: 'Invalid CAPTCHA' });
  }
  
  // ... login
});
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: CAPTCHA fuerte con expiración
const captcha = require('svg-captcha');

app.get('/api/captcha', (req, res) => {
  // CAPTCHA complejo
  const cap = captcha.create({
    noise: 3,                  // Con ruido
    size: 6,                   // 6 caracteres
    ignoreChars: '0il1Lo',     // Caracteres ambiguos
    color: true,               // Color (más difícil para OCR)
    background: '#ddd',
    width: 150,
    height: 50,
    fontSize: 60
  });
  
  // Almacenar con expiración (5 minutos)
  const captchaId = crypto.randomBytes(16).toString('hex');
  const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutos
  
  req.session.captchas = req.session.captchas || {};
  req.session.captchas[captchaId] = {
    text: cap.text,
    expiresAt: expirationTime,
    attempts: 0,
    used: false
  };
  
  // Limpiar CAPTCHAs expirados
  Object.keys(req.session.captchas).forEach(id => {
    if (Date.now() > req.session.captchas[id].expiresAt) {
      delete req.session.captchas[id];
    }
  });
  
  res.type('svg');
  res.json({
    captchaId: captchaId,
    image: cap.data
  });
});

app.post('/api/login', (req, res) => {
  const { username, password, captchaId, captchaText } = req.body;
  
  if (!captchaId || !req.session.captchas[captchaId]) {
    return res.status(400).json({ error: 'CAPTCHA not found' });
  }
  
  const stored = req.session.captchas[captchaId];
  
  // 1. Validar que no ha expirado
  if (Date.now() > stored.expiresAt) {
    delete req.session.captchas[captchaId];
    return res.status(400).json({ error: 'CAPTCHA expired' });
  }
  
  // 2. Validar que no ha sido usado
  if (stored.used) {
    return res.status(400).json({ error: 'CAPTCHA already used' });
  }
  
  // 3. Limitar intentos (máx 3)
  if (stored.attempts > 3) {
    delete req.session.captchas[captchaId];
    return res.status(400).json({ error: 'Too many CAPTCHA attempts' });
  }
  
  // 4. Validar (case-insensitive)
  if (captchaText.toLowerCase() !== stored.text.toLowerCase()) {
    stored.attempts++;
    return res.status(400).json({ 
      error: 'Invalid CAPTCHA',
      attemptsLeft: 3 - stored.attempts
    });
  }
  
  // 5. Marcar como usado
  stored.used = true;
  
  // ... continuar con login
  
  // 6. Eliminar el CAPTCHA después de usar
  delete req.session.captchas[captchaId];
});

// Alternativa: Usar Google reCAPTCHA v3 (servidor)
app.post('/api/login', async (req, res) => {
  const { username, password, recaptchaToken } = req.body;
  
  // Verificar token con Google
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: recaptchaToken
    })
  });
  
  const data = await response.json();
  
  // Score > 0.5 = probablemente humano
  if (data.score < 0.5) {
    return res.status(400).json({ error: 'Suspicious activity detected' });
  }
  
  // ... continuar con login
});
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Complejidad** | Bajo (4 caracteres) | Alto (6+ caracteres) |
| **Ruido** | No | Sí |
| **Color** | No | Sí |
| **Expiración** | No | Sí (5 min) |
| **Reutilización** | Sí | No |
| **Intentos limitados** | No | Sí (3) |
| **Unique ID** | No | Sí |

### 🔐 Mejores Prácticas

1. **Complejidad alta:** 6+ caracteres con símbolos
2. **Ruido visual:** Líneas y puntos distractores
3. **Expiración:** 5-10 minutos máximo
4. **Una sola vez:** No reutilizable
5. **Intentos limitados:** Máximo 3-5 intentos
6. **IDs únicos:** Cada CAPTCHA tiene ID único
7. **Considerar reCAPTCHA:** Para usuarios reales

---

## 7. SQL Injection

### 🎯 ¿Qué es?
Cuando entrada del usuario se concatena directamente en consultas SQL. Un atacante puede modificar la lógica de la consulta, acceder a datos, o modificar/eliminar registros.

### ⚠️ Impacto
- **Criticidad:** 🔴 CRÍTICA
- **Riesgo:** Acceso total a base de datos
- **Alcance:** Toda la información de la BD
- **Consecuencias:** Robo de datos, eliminación, modificación

### 🔍 Cómo Funciona el Ataque

```sql
-- Input normal
SELECT * FROM users WHERE username = 'admin' AND password = 'hash'

-- Input malicioso
username: admin' OR '1'='1
password: anything

-- Consulta resultante
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'anything'
-- Resultado: Devuelve TODOS los usuarios
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Concatenación de SQL
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // CONCATENACIÓN DIRECTA = INYECCIÓN POSIBLE
  const query = `
    SELECT * FROM users 
    WHERE username = '${username}' 
    AND password = '${password}'
  `;
  
  const user = await db.query(query);
  // ...
});

// Atacante envía:
// username: admin' OR '1'='1
// password: anything
// La consulta se convierte en:
// SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'anything'
// Devuelve todos los usuarios
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Usar prepared statements (parametrized queries)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Validar entrada
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  if (username.length > 50 || password.length > 255) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  // 2. Usar parametrized query (? es placeholder)
  const query = `
    SELECT id, username, email FROM users 
    WHERE username = ? AND password = ?
  `;
  
  // Los parámetros se pasan separadamente
  // La BD se encarga de escaparlos
  const [user] = await db.query(query, [username, password]);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ token: generateToken(user) });
});

// O usar ORM (Sequelize, TypeORM)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // ORM automáticamente parametriza
  const user = await User.findOne({
    where: {
      username: username,
      password: password
    }
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ token: generateToken(user) });
});

// Ejemplo con múltiples parámetros
app.post('/api/search', async (req, res) => {
  const { category, minPrice, maxPrice, searchTerm } = req.body;
  
  // ✅ SEGURO: Todos los parámetros van separados
  const query = `
    SELECT * FROM products 
    WHERE category = ?
    AND price BETWEEN ? AND ?
    AND name LIKE ?
    ORDER BY price ASC
  `;
  
  const products = await db.query(query, [
    category,
    minPrice,
    maxPrice,
    `%${searchTerm}%`
  ]);
  
  res.json(products);
});

// ❌ NUNCA hacer esto (aunque parezca seguro):
const query = `WHERE id = ${req.params.id}`; // VULNERABLE

// ✅ SIEMPRE usar parámetros:
const query = `WHERE id = ?`;
const result = await db.query(query, [req.params.id]);
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Método** | Concatenación | Parametrized queries |
| **Escapar entrada** | Manual (inseguro) | Automático |
| **Riesgo** | Alto | Muy bajo |
| **Legibilidad** | Baja | Alta |
| **Performance** | Normal | Mejor (cached) |

### 🔐 Mejores Prácticas

1. **Nunca concatenar SQL:** Usar placeholders (?)
2. **Usar prepared statements:** Siempre
3. **Usar ORM:** Automáticamente parametriza
4. **Validar entrada:** Validación adicional
5. **Limitar caracteres:** Longitud máxima
6. **Logging:** Registrar consultas sospechosas
7. **Least privilege:** Compte BD con mínimos permisos

---

## 8. Blind SQL Injection

### 🎯 ¿Qué es?
Una variante de SQL Injection donde el atacante no recibe mensajes de error. Extrae información mediante respuestas booleanas (verdadero/falso) o tiempos.

### ⚠️ Impacto
- **Criticidad:** 🔴 ALTA
- **Riesgo:** Acceso a base de datos sin errores visibles
- **Alcance:** Exfiltración lenta de datos
- **Consecuencias:** Robo de datos, análisis de estructura BD

### 🔍 Cómo Funciona el Ataque

```sql
-- Ataque booleano
SELECT * FROM users WHERE id = 1 AND 1=1  -- True, devuelve datos
SELECT * FROM users WHERE id = 1 AND 1=2  -- False, no devuelve datos

-- Ataque temporal (time-based)
SELECT * FROM users WHERE id = 1 AND SLEEP(5)  -- Espera 5 seg si verdadero
SELECT * FROM users WHERE id = 1 AND IF(1=1, SLEEP(5), 0)  -- Sleep condicional
```

### 💥 Ejemplo de Código Vulnerable

```javascript
// ❌ VULNERABLE: Sin protección contra blind SQL injection
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  
  // Incluso con parametrización, si el error es visible = problema
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  
  if (user.length > 0) {
    res.json(user[0]); // Respuesta diferente
  } else {
    res.status(404).json({ error: 'User not found' }); // Otra respuesta
  }
});

// Atacante puede inferir:
// GET /api/user/1 AND 1=1  --> 200 (verdadero)
// GET /api/user/1 AND 1=2  --> 404 (falso)
// Así extrae información bit a bit
```

### 🛡️ Solución

```javascript
// ✅ SEGURO: Respuestas genéricas y rate limiting
const rateLimit = require('express-rate-limit');

// Rate limiting estricto en queries
const queryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10,                 // Máximo 10 requests
  message: 'Too many requests'
});

app.get('/api/user/:id', queryLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Validar ID es número
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // 2. Validar rango razonable
    if (id > 999999) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const user = await db.query(
      'SELECT id, username, email FROM users WHERE id = ? AND active = 1',
      [id]
    );
    
    if (user.length > 0) {
      res.json(user[0]);
    } else {
      // ✅ IMPORTANTE: Misma respuesta para error
      res.status(400).json({ error: 'Invalid request' });
    }
  } catch (error) {
    // ✅ No revelar detalles del error
    console.error('Query error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Alternativa: Usar timeout en BD
app.get('/api/user/:id', queryLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Timeout de 2 segundos para query
    const user = await Promise.race([
      db.query('SELECT * FROM users WHERE id = ?', [id]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
    ]);
    
    if (user.length > 0) {
      res.json(user[0]);
    } else {
      res.status(400).json({ error: 'Invalid request' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// WAF (Web Application Firewall) - Detectar patrones
const detectSQLInjection = (value) => {
  // Patrones típicos de SQL injection
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i,
    /(-{2}|\/\*|\*\/|;|\||&&)/,
    /(\bSLEEP\b|\bBENCHMARK\b)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
};

app.use((req, res, next) => {
  // Revisar parámetros
  const allParams = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  for (let param in allParams) {
    if (detectSQLInjection(allParams[param])) {
      console.warn(`SQL Injection attempt detected: ${param}`);
      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  
  next();
});
```

### 📊 Comparación

| Aspecto | ❌ Vulnerable | ✅ Seguro |
|---------|---|---|
| **Parametrized** | No | Sí |
| **Respuestas** | Diferentes | Genéricas |
| **Rate limiting** | No | Sí |
| **Validación entrada** | No | Sí |
| **Timeout query** | No | Sí |
| **Logging** | No | Sí |
| **WAF** | No | Sí |

### 🔐 Mejores Prácticas

1. **Parametrized queries:** Siempre (como SQL Injection)
2. **Respuestas idénticas:** Mismo mensaje para error/no encontrado
3. **Rate limiting:** Máximo 10 requests/minuto
4. **Validación estricta:** Validar tipo de dato
5. **Timeout:** 2 segundos máximo en queries
6. **Error handling:** Nunca revelar detalles
7. **Logging y alertas:** Detectar intentos
8. **WAF:** Detectar patrones maliciosos

---

## 📊 Resumen de Vulnerabilidades

| # | Vulnerabilidad | CVSS | Impacto | Corrección |
|---|---|---|---|---|
| 1 | Brute Force | 7.5 | Alto | Rate limiting + CAPTCHA |
| 2 | Command Injection | 9.8 | Crítico | execFile + validación |
| 3 | CSRF | 6.5 | Medio-Alto | Token CSRF |
| 4 | File Inclusion | 7.5 | Alto | Path validation |
| 5 | File Upload | 9.1 | Crítico | Validación completa |
| 6 | Insecure CAPTCHA | 5.3 | Medio | CAPTCHA fuerte + expiración |
| 7 | SQL Injection | 9.8 | Crítico | Parametrized queries |
| 8 | Blind SQL Injection | 7.5 | Alto | Rate limit + respuestas genéricas |

---

**Documento generado:** 2 de diciembre de 2025  
**Versión:** 1.0

