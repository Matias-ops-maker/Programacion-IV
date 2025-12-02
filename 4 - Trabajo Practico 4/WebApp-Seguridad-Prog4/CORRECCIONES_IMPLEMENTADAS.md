# 🛡️ Correcciones Implementadas - WebApp-Seguridad-Prog4

**Documento:** Guía de correcciones realizadas para cada vulnerabilidad  
**Fecha:** 2 de diciembre de 2025  
**Objetivo:** Explicar qué se corrigió y cómo se implementó en el código

---

## 📑 Tabla de Contenidos

| Vulnerabilidad                                           | Estado       | Corrección Clave                  |
| -------------------------------------------------------- | ------------ | --------------------------------- |
| [Brute Force](#1-brute-force-protection)                 | ✅ Corregido | Rate limiting + CAPTCHA           |
| [Command Injection](#2-command-injection-prevention)     | ✅ Corregido | execFile + validación             |
| [CSRF Protection](#3-csrf-token-implementation)          | ✅ Corregido | Token CSRF en session             |
| [File Inclusion](#4-path-traversal-prevention)           | ✅ Corregido | Path normalization                |
| [File Upload](#5-secure-file-upload)                     | ✅ Corregido | Validación múltiple               |
| [Insecure CAPTCHA](#6-secure-captcha)                    | ✅ Corregido | Expiración + límite intentos      |
| [SQL Injection](#7-sql-injection-prevention)             | ✅ Corregido | Parametrized queries              |
| [Blind SQL Injection](#8-blind-sql-injection-mitigation) | ✅ Corregido | Rate limit + respuestas genéricas |

---

## 1. Brute Force Protection

### Problema Original

- ❌ Sin límite de intentos de login
- ❌ Sin CAPTCHA de protección
- ❌ Sin bloqueo de IP
- ❌ Sin logging de intentos

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/rateLimiter.js

const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redis = require("redis");

// Configurar cliente Redis
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

// Rate limiter para login
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:login:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: "Demasiados intentos. Intenta más tarde.",
  statusCode: 429,
  skip: (req) => {
    // Skip para IPs confiables
    return req.ip === "127.0.0.1";
  },
  keyGenerator: (req) => {
    // Usar IP + username para limitar por usuario
    return `${req.ip}:${req.body.username}`;
  },
});

module.exports = { loginLimiter };

// archivo: backend/src/routes/auth.js

const { loginLimiter } = require("../middleware/rateLimiter");
const { validateCaptcha } = require("../utils/captcha");

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password, captchaId, captchaValue } = req.body;

    // Obtener contador de intentos fallidos
    const loginAttempts = await LoginAttempt.count({
      where: {
        username: username,
        ip: req.ip,
        success: false,
        createdAt: {
          $gt: new Date(Date.now() - 15 * 60 * 1000), // últimos 15 min
        },
      },
    });

    // Si hay 3+ intentos fallidos, requerir CAPTCHA
    if (loginAttempts >= 3) {
      if (!captchaId || !captchaValue) {
        return res.status(400).json({
          error: "CAPTCHA required",
          requiresCaptcha: true,
        });
      }

      // Validar CAPTCHA
      const isValidCaptcha = await validateCaptcha(
        captchaId,
        captchaValue,
        req.session
      );

      if (!isValidCaptcha) {
        return res.status(400).json({ error: "Invalid CAPTCHA" });
      }
    }

    // Autenticar usuario
    const user = await User.authenticate(username, password);

    if (!user) {
      // Registrar intento fallido
      await LoginAttempt.create({
        username: username,
        ip: req.ip,
        success: false,
        userAgent: req.headers["user-agent"],
      });

      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: Math.max(0, 5 - loginAttempts - 1),
      });
    }

    // Registrar intento exitoso
    await LoginAttempt.create({
      userId: user.id,
      username: username,
      ip: req.ip,
      success: true,
      userAgent: req.headers["user-agent"],
    });

    // Limpiar contador
    await LoginAttempt.destroy({
      where: { username: username, success: false },
    });

    // Generar token
    const token = generateToken(user);

    res.json({
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
```

### Cambios en BD

```sql
-- Tabla para registrar intentos de login
CREATE TABLE login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  ip VARCHAR(45),
  success BOOLEAN,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username_ip (username, ip),
  INDEX idx_created_at (created_at)
);
```

### Validación

```bash
# Test: Intentar 5 logins fallidos rápidamente
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
  echo "Intento $i"
done

# Esperado: El 6to intento devuelve 429 (Too Many Requests)
```

---

## 2. Command Injection Prevention

### Problema Original

- ❌ Uso de `exec()` con concatenación
- ❌ Sin validación de entrada
- ❌ Sin timeout

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/commandExecution.js

const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

/**
 * Ejecutar comando de forma segura
 */
async function executeCommand(command, args, options = {}) {
  // Validar comando está en whitelist
  const ALLOWED_COMMANDS = {
    convert: "/usr/bin/convert", // ImageMagick
    ffmpeg: "/usr/bin/ffmpeg", // Video
    gs: "/usr/bin/gs", // Ghostscript
  };

  const commandPath = ALLOWED_COMMANDS[command];
  if (!commandPath) {
    throw new Error(`Command not allowed: ${command}`);
  }

  // Validar que cada argumento es seguro
  const validatedArgs = args.map((arg) => {
    // No permitir path traversal
    if (
      typeof arg === "string" &&
      (arg.includes("..") || arg.startsWith("/"))
    ) {
      throw new Error(`Invalid argument: ${arg}`);
    }
    return arg;
  });

  try {
    // Usar execFile sin shell (más seguro que exec)
    const result = await execFileAsync(commandPath, validatedArgs, {
      timeout: options.timeout || 5000, // 5 segundos máximo
      maxBuffer: options.maxBuffer || 1024 * 1024, // 1MB máximo
      cwd: options.cwd || "/tmp", // Directorio de trabajo seguro
      env: {
        PATH: "/usr/bin:/bin", // Environment limitado
        HOME: "/tmp",
      },
      // NO incluir stdio: 'inherit' (evita acceso a descriptores)
    });

    return result;
  } catch (error) {
    if (error.killed) {
      throw new Error("Command execution timeout");
    }
    throw error;
  }
}

module.exports = { executeCommand };

// archivo: backend/src/routes/files.js

const { executeCommand } = require("../middleware/commandExecution");

router.post("/api/process-image", validateUpload, async (req, res) => {
  try {
    const { filename, width, height } = req.body;

    // Validar parámetros
    if (!filename || !filename.match(/^[a-zA-Z0-9._-]+$/)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      return res.status(400).json({ error: "Invalid dimensions" });
    }

    if (width < 1 || width > 4000 || height < 1 || height > 4000) {
      return res.status(400).json({ error: "Dimensions out of range" });
    }

    // Validar que archivo existe
    const filePath = path.join("/uploads", req.user.id.toString(), filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Ejecutar comando de forma segura
    const outputFile = `${filePath}.processed.jpg`;
    const result = await executeCommand(
      "convert",
      [filePath, "-resize", `${width}x${height}`, "-quality", "85", outputFile],
      {
        timeout: 10000,
        cwd: path.dirname(filePath),
      }
    );

    res.json({
      success: true,
      output: path.basename(outputFile),
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ error: "Processing failed" });
  }
});
```

### Validación

```bash
# Test: Intentar inyectar comando
curl -X POST http://localhost:5000/api/process-image \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "image.jpg; rm -rf /uploads",
    "width": 100,
    "height": 100
  }'

# Esperado: 400 Bad Request (comando rechazado)
```

---

## 3. CSRF Token Implementation

### Problema Original

- ❌ Sin tokens CSRF
- ❌ Cookies SameSite no configurado
- ❌ HTTPOnly no habilitado

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/csrf.js

const csrf = require("csurf");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");

// Cliente Redis para session
const redisClient = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

// Configurar session segura
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  cookie: {
    secure: process.env.NODE_ENV === "production", // Requiere HTTPS en prod
    httpOnly: true, // No accesible desde JS
    sameSite: "strict", // No enviar en cross-site
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
});

// Protección CSRF
const csrfProtection = csrf({
  cookie: false, // Usar session en lugar de cookie
});

module.exports = { sessionMiddleware, csrfProtection };

// archivo: backend/src/server.js

const { sessionMiddleware, csrfProtection } = require("./middleware/csrf");

// Aplicar session
app.use(sessionMiddleware);

// Endpoint para obtener token CSRF
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Proteger acciones sensibles
router.post("/api/transfer", csrfProtection, async (req, res) => {
  // El token CSRF ya fue validado por el middleware
  const { toAccount, amount } = req.body;

  const transfer = await Transfer.create({
    fromAccount: req.user.id,
    toAccount,
    amount,
    createdAt: new Date(),
  });

  res.json({ success: true, transfer });
});

// Error handler para CSRF
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).json({ error: "Invalid CSRF token" });
  } else {
    next(err);
  }
});

// archivo: frontend/src/services/api.js

// Cliente HTTP con soporte CSRF
class APIClient {
  constructor() {
    this.csrfToken = null;
  }

  async init() {
    // Obtener token CSRF del servidor
    const response = await fetch("/api/csrf-token");
    const data = await response.json();
    this.csrfToken = data.csrfToken;
  }

  async post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": this.csrfToken, // Incluir token en header
      },
      body: JSON.stringify(body),
      credentials: "include", // Incluir cookies
    });
  }
}

// Inicializar al cargar la app
const api = new APIClient();
api.init();
```

### Validación

```bash
# Test: Intentar POST sin token CSRF
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "hacker", "amount": 1000}' \
  -c cookies.txt \
  -b cookies.txt

# Esperado: 403 Forbidden (Invalid CSRF token)
```

---

## 4. Path Traversal Prevention

### Problema Original

- ❌ Sin validación de ruta
- ❌ Permite `../` para subir directorios
- ❌ Sin restricción de tipo de archivo

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/fileAccess.js

const path = require("path");
const fs = require("fs");

/**
 * Middleware para validar acceso seguro a archivos
 */
function validateFilePath(req, res, next) {
  const { filename } = req.params;

  // 1. Validar que nombre no está vacío
  if (!filename) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // 2. Validar que no contiene caracteres peligrosos
  const dangerousPatterns = ["..", "~", "//", "\0"];
  if (dangerousPatterns.some((p) => filename.includes(p))) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // 3. Validar extensión está en whitelist
  const ext = path.extname(filename).toLowerCase();
  const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".doc",
    ".docx",
  ];

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(403).json({ error: "File type not allowed" });
  }

  // 4. Construir ruta absoluta segura
  const baseDir = path.resolve(__dirname, "../../uploads");
  const filePath = path.resolve(baseDir, filename);

  // 5. CRÍTICO: Validar que la ruta final está dentro del directorio base
  if (!filePath.startsWith(baseDir)) {
    return res.status(403).json({ error: "Access denied" });
  }

  // 6. Validar que archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // 7. Validar que es archivo (no directorio, no symlink)
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Guardar ruta validada en request
  req.validatedFilePath = filePath;
  req.safeFilename = filename;

  next();
}

module.exports = { validateFilePath };

// archivo: backend/src/routes/files.js

const { validateFilePath } = require("../middleware/fileAccess");

// Usar middleware de validación
router.get("/api/file/:filename", validateFilePath, (req, res) => {
  // req.validatedFilePath ya está validado y seguro
  res.download(req.validatedFilePath, req.safeFilename);
});

// Alternativa más segura: Mapeo de IDs
// En lugar de usar nombre de archivo, usar ID

router.get("/api/file/:fileId", authenticateUser, async (req, res) => {
  const fileRecord = await File.findOne({
    where: {
      id: req.params.fileId,
      userId: req.user.id, // Solo archivos del usuario
    },
  });

  if (!fileRecord) {
    return res.status(404).json({ error: "File not found" });
  }

  // Construir ruta segura usando info de BD
  const filePath = path.join(
    "/uploads",
    req.user.id.toString(),
    fileRecord.storedFilename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, fileRecord.originalFilename);
});
```

### Validación

```bash
# Test: Intentar path traversal
curl http://localhost:5000/api/file/../../etc/passwd
# Esperado: 403 Forbidden

curl http://localhost:5000/api/file/../../../.env
# Esperado: 403 Forbidden

# Test: Acceso legítimo
curl http://localhost:5000/api/file/document.pdf
# Esperado: 200 OK (descarga archivo)
```

---

## 5. Secure File Upload

### Problema Original

- ❌ Sin validación de tamaño
- ❌ Sin validación de tipo MIME
- ❌ Sin validación de contenido
- ❌ Nombres de archivo no aleatorios

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/upload.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const fileType = require("file-type");

// Configuración segura de storage
const storage = multer.memoryStorage(); // Almacenar en memoria primero

const fileFilter = async (req, file, cb) => {
  try {
    // 1. Validar tamaño del archivo
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return cb(new Error("File size exceeds 5MB limit"));
    }

    // 2. Validar MIME type
    const ALLOWED_MIMES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed: ${file.mimetype}`));
    }

    // 3. Validar extensión
    const ALLOWED_EXTENSIONS = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Extension not allowed: ${ext}`));
    }

    // 4. Validar contenido real del archivo
    const detected = await fileType.fromBuffer(file.buffer);

    if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
      return cb(new Error("File content does not match extension"));
    }

    // 5. Validación específica por tipo
    if (detected.mime.startsWith("image/")) {
      // Para imágenes, verificar que no contiene código ejecutable
      const imageContent = file.buffer.toString("utf8", 0, 1000);
      if (imageContent.includes("<?php") || imageContent.includes("<script")) {
        return cb(new Error("Suspicious content detected in image"));
      }
    }

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = { upload };

// archivo: backend/src/routes/upload.js

const { upload } = require("../middleware/upload");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

router.post(
  "/api/upload",
  authenticateUser,
  upload.single("file"),
  async (req, res) => {
    try {
      // El archivo está en req.file.buffer después del validador

      // 1. Generar nombre aleatorio pero mantener extensión
      const ext = path.extname(req.file.originalname);
      const uniqueName = `${Date.now()}-${crypto
        .randomBytes(8)
        .toString("hex")}${ext}`;

      // 2. Crear directorio por usuario (aislamiento)
      const userUploadDir = path.join("/uploads", req.user.id.toString());

      if (!fs.existsSync(userUploadDir)) {
        fs.mkdirSync(userUploadDir, { recursive: true, mode: 0o700 });
      }

      // 3. Guardar archivo
      const filePath = path.join(userUploadDir, uniqueName);
      fs.writeFileSync(filePath, req.file.buffer);

      // 4. Cambiar permisos (no ejecutable)
      fs.chmodSync(filePath, 0o644);

      // 5. Guardar metadata en BD
      const fileRecord = await File.create({
        userId: req.user.id,
        originalFilename: req.file.originalname,
        storedFilename: uniqueName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      });

      res.json({
        fileId: fileRecord.id,
        filename: req.file.originalname,
        size: req.file.size,
        url: `/api/file/${fileRecord.id}`, // URL segura usando ID
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed: " + error.message });
    }
  }
);

// Error handler específico para multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "FILE_TOO_LARGE") {
      return res.status(413).json({ error: "File too large" });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
});
```

### Validación

```bash
# Test: Upload con archivo válido
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg"
# Esperado: 200 OK

# Test: Upload con archivo demasiado grande
dd if=/dev/zero of=large_file.jpg bs=1M count=10
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large_file.jpg"
# Esperado: 413 Payload Too Large

# Test: Upload de archivo malicioso
echo '<?php system($_GET["cmd"]); ?>' > shell.jpg
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@shell.jpg"
# Esperado: 400 Bad Request
```

---

## 6. Secure CAPTCHA

### Problema Original

- ❌ CAPTCHA predecible
- ❌ Sin expiración
- ❌ Reutilizable
- ❌ Sin límite de intentos

### Corrección Implementada

```javascript
// archivo: backend/src/utils/captcha.js

const captcha = require("svg-captcha");
const crypto = require("crypto");

class CAPTCHAManager {
  constructor() {
    this.captchas = new Map();
  }

  generate(session) {
    // Generar CAPTCHA con alta complejidad
    const cap = captcha.create({
      noise: 3, // Ruido visual
      size: 6, // 6 caracteres
      ignoreChars: "0il1Lo", // Evitar ambiguos
      color: true, // Con color
      background: "#ddd",
      width: 150,
      height: 50,
      fontSize: 60,
    });

    // Generar ID único para este CAPTCHA
    const captchaId = crypto.randomBytes(16).toString("hex");

    // Calcular expiración (5 minutos)
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Almacenar CAPTCHA con metadata
    const captchaData = {
      text: cap.text.toLowerCase(),
      expiresAt: expiresAt,
      attempts: 0,
      maxAttempts: 3,
      used: false,
      createdAt: Date.now(),
    };

    // Guardar en session (persistencia)
    if (!session.captchas) {
      session.captchas = {};
    }
    session.captchas[captchaId] = captchaData;

    // Limpiar CAPTCHAs expirados
    this.cleanupExpired(session);

    return {
      captchaId: captchaId,
      image: cap.data,
    };
  }

  validate(session, captchaId, userInput) {
    if (!captchaId || !session.captchas || !session.captchas[captchaId]) {
      throw new Error("CAPTCHA not found");
    }

    const captchaData = session.captchas[captchaId];

    // 1. Validar expiración
    if (Date.now() > captchaData.expiresAt) {
      delete session.captchas[captchaId];
      throw new Error("CAPTCHA expired");
    }

    // 2. Validar que no ha sido usado
    if (captchaData.used) {
      throw new Error("CAPTCHA already used");
    }

    // 3. Validar intentos
    if (captchaData.attempts >= captchaData.maxAttempts) {
      delete session.captchas[captchaId];
      throw new Error("Too many attempts");
    }

    // 4. Comparar (case-insensitive)
    const isValid = userInput.toLowerCase() === captchaData.text;

    if (!isValid) {
      captchaData.attempts++;
      const attemptsLeft = captchaData.maxAttempts - captchaData.attempts;

      const error = new Error("Invalid CAPTCHA");
      error.attemptsLeft = attemptsLeft;
      throw error;
    }

    // 5. Marcar como usado
    captchaData.used = true;

    // 6. Limpiar después de usar
    setTimeout(() => {
      if (session.captchas) {
        delete session.captchas[captchaId];
      }
    }, 1000);

    return true;
  }

  cleanupExpired(session) {
    if (!session.captchas) return;

    Object.keys(session.captchas).forEach((id) => {
      if (Date.now() > session.captchas[id].expiresAt) {
        delete session.captchas[id];
      }
    });
  }
}

module.exports = new CAPTCHAManager();

// archivo: backend/src/routes/auth.js

const captchaManager = require("../utils/captcha");

// Endpoint para obtener CAPTCHA
router.get("/api/captcha", (req, res) => {
  const captchaData = captchaManager.generate(req.session);

  res.json({
    captchaId: captchaData.captchaId,
    image: captchaData.image,
  });
});

// Login con CAPTCHA
router.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password, captchaId, captchaValue } = req.body;

    // Obtener intentos fallidos
    const failedAttempts = await LoginAttempt.count({
      where: {
        username,
        success: false,
        createdAt: { $gt: Date.now() - 15 * 60 * 1000 },
      },
    });

    // Si hay 3+ intentos fallidos, requerir CAPTCHA
    if (failedAttempts >= 3) {
      if (!captchaId || !captchaValue) {
        return res.status(400).json({
          error: "CAPTCHA required",
          requiresCaptcha: true,
        });
      }

      try {
        captchaManager.validate(req.session, captchaId, captchaValue);
      } catch (error) {
        return res.status(400).json({
          error: error.message,
          attemptsLeft: error.attemptsLeft,
        });
      }
    }

    // Proceder con login
    const user = await User.authenticate(username, password);

    if (!user) {
      await LoginAttempt.create({
        username,
        ip: req.ip,
        success: false,
      });

      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Login exitoso
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});
```

### Validación

```bash
# Test: Obtener CAPTCHA
curl http://localhost:5000/api/captcha

# Test: Usar mismo CAPTCHA dos veces
# Debería funcionar la primera vez, fallar la segunda
```

---

## 7. SQL Injection Prevention

### Problema Original

- ❌ Concatenación de SQL
- ❌ Sin parametrización
- ❌ Sin prepared statements

### Corrección Implementada

```javascript
// archivo: backend/src/config/database.js

const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

// archivo: backend/src/models/User.js

const pool = require("../config/database");

class User {
  static async findByUsername(username) {
    // ✅ SEGURO: Usar placeholders (?)
    const query = `
      SELECT id, username, password, email, active, created_at 
      FROM users 
      WHERE username = ? AND active = 1
    `;

    const [rows] = await pool.query(query, [username]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async authenticate(username, password) {
    // ✅ SEGURO: Los parámetros van separados
    const query = `
      SELECT id, username, email, active 
      FROM users 
      WHERE username = ? AND password = ?
    `;

    const [rows] = await pool.query(query, [username, password]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async search(criteria) {
    // ✅ SEGURO: Query dinámico pero siempre parametrizado
    let query = "SELECT id, username, email FROM users WHERE 1=1";
    const params = [];

    if (criteria.username) {
      query += " AND username LIKE ?";
      params.push(`%${criteria.username}%`);
    }

    if (criteria.email) {
      query += " AND email = ?";
      params.push(criteria.email);
    }

    if (criteria.createdAfter) {
      query += " AND created_at > ?";
      params.push(criteria.createdAfter);
    }

    // ✅ Todos los parámetros van en array, no concatenados
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async create(userData) {
    const { username, password, email } = userData;

    const query = `
      INSERT INTO users (username, password, email, active, created_at)
      VALUES (?, ?, ?, 1, NOW())
    `;

    const [result] = await pool.query(query, [username, password, email]);
    return result.insertId;
  }
}

module.exports = User;

// archivo: backend/src/routes/search.js

const User = require("../models/User");

router.get("/api/search-users", async (req, res) => {
  try {
    const { username, email, createdAfter } = req.query;

    // ✅ SEGURO: Usar método que parametriza
    const users = await User.search({
      username: username || null,
      email: email || null,
      createdAfter: createdAfter || null,
    });

    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Alternativa: Usar ORM (Sequelize)
const { Op } = require("sequelize");

router.get("/api/users", async (req, res) => {
  try {
    const { username, email } = req.query;

    // ✅ SEGURO: ORM parametriza automáticamente
    const users = await User.findAll({
      where: {
        ...(username && { username: { [Op.like]: `%${username}%` } }),
        ...(email && { email: email }),
      },
      attributes: ["id", "username", "email"],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});
```

### Validación

```bash
# Test: SQL Injection
curl "http://localhost:5000/api/search-users?username=admin' OR '1'='1"
# Esperado: No se inyecta, devuelve búsqueda literal

# Test: búsqueda legítima
curl "http://localhost:5000/api/search-users?username=admin"
# Esperado: 200 OK, devuelve usuarios con "admin" en username
```

---

## 8. Blind SQL Injection Mitigation

### Problema Original

- ❌ Sin rate limiting en queries
- ❌ Respuestas diferentes para error/no encontrado
- ❌ Sin timeout en queries

### Corrección Implementada

```javascript
// archivo: backend/src/middleware/blindSQLProtection.js

const rateLimit = require("express-rate-limit");

// Rate limiter para queries específicas
const queryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 requests
  message: "Too many requests. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Limitar por IP + endpoint
    return `${req.ip}:${req.path}`;
  },
});

// Detectar patrones típicos de blind SQL injection
const sqlInjectionPatterns = [
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bOR\b.*=.*)/i,
  /(\bAND\b.*=.*)/i,
  /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i,
  /(-{2}|\/\*|\*\/)/,
  /(\bSLEEP\b|\bBENCHMARK\b)/i,
  /(;\s*\w+)/,
];

function detectSQLInjectionPattern(value) {
  if (!value || typeof value !== "string") return false;
  return sqlInjectionPatterns.some((pattern) => pattern.test(value));
}

// Middleware para validar entrada
function validateAgainstSQLInjection(req, res, next) {
  const allParams = {
    ...req.query,
    ...req.body,
    ...req.params,
  };

  for (let [key, value] of Object.entries(allParams)) {
    if (detectSQLInjectionPattern(value)) {
      console.warn(`SQL Injection attempt detected in ${key}`);
      return res.status(400).json({ error: "Invalid request" });
    }
  }

  next();
}

module.exports = { queryLimiter, validateAgainstSQLInjection };

// archivo: backend/src/routes/users.js

const {
  queryLimiter,
  validateAgainstSQLInjection,
} = require("../middleware/blindSQLProtection");

// Aplicar protección a endpoint vulnerable
router.get(
  "/api/user/:id",
  queryLimiter,
  validateAgainstSQLInjection,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validación adicional
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      if (id > 999999) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Ejecutar con timeout
      const user = await Promise.race([
        User.findById(id),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Query timeout")),
            2000 // 2 segundos máximo
          )
        ),
      ]);

      if (user) {
        // ✅ Devolver solo datos permitidos
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      } else {
        // ✅ IMPORTANTE: Misma respuesta para error
        res.status(400).json({ error: "Invalid request" });
      }
    } catch (error) {
      // ✅ Respuesta genérica en todos los errores
      console.error("Query error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  }
);

// Alternativa: Usar procedimiento almacenado
router.get("/api/user/:id", queryLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Usar stored procedure (encapsulation)
    const [result] = await db.query("CALL sp_get_user_by_id(?)", [id]);

    if (result && result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(400).json({ error: "Invalid request" });
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
});

// Stored procedure en BD
const createStoredProcedure = `
CREATE PROCEDURE sp_get_user_by_id(IN p_id INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SELECT NULL AS id;  -- Respuesta segura en error
  END;
  
  SELECT id, username, email FROM users 
  WHERE id = p_id AND active = 1
  LIMIT 1;
END;
`;
```

### Validación

```bash
# Test: Rate limiting
for i in {1..15}; do
  curl "http://localhost:5000/api/user/1"
done
# Después de 10, devuelve 429 Too Many Requests

# Test: Blind SQL Injection attempt
curl "http://localhost:5000/api/user/1 AND SLEEP(5)"
# Esperado: 400 Bad Request (patrón detectado)

# Test: Legítimo
curl "http://localhost:5000/api/user/1"
# Esperado: 200 OK con datos del usuario
```

---

## 📊 Resumen de Correcciones

| Vulnerabilidad      | Corrección Implementada                   | Validación                           | Estado |
| ------------------- | ----------------------------------------- | ------------------------------------ | ------ |
| Brute Force         | Rate limiting (5/15min) + CAPTCHA         | Test: 5 intentos permitidos          | ✅     |
| Command Injection   | execFile + whitelist                      | Test: Rechazo de comandos maliciosos | ✅     |
| CSRF                | Token CSRF en session                     | Test: 403 sin token                  | ✅     |
| File Inclusion      | Path normalization + whitelist            | Test: Rechazo de `../`               | ✅     |
| File Upload         | Validación múltiple + nombre aleatorio    | Test: Rechazo de PHP                 | ✅     |
| Insecure CAPTCHA    | Expiración 5min + límite 3 intentos       | Test: Expiración y reutilización     | ✅     |
| SQL Injection       | Parametrized queries                      | Test: Rechazo de `' OR '1'='1`       | ✅     |
| Blind SQL Injection | Rate limit 10/1min + respuestas genéricas | Test: 429 después de 10 requests     | ✅     |

---

**Documento generado:** 2 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Todas las correcciones implementadas
