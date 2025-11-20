const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Directorio seguro de subida
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.txt', '.pdf']);
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'text/plain', 'application/pdf'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Renombrar para evitar ejecución y colisiones: timestamp + random + extensión permitida
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    req.fileValidationError = 'File type not allowed';
    return cb(null, false);
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    req.fileValidationError = 'Invalid MIME type';
    return cb(null, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB límite de tamaño
  }
});

module.exports = upload;
