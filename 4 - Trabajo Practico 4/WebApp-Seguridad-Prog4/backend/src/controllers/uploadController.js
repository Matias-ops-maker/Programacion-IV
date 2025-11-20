const upload = require('../config/multer');
const path = require('path');

// Middleware seguro con manejo de errores explícito
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    next();
  });
};

// Controlador seguro de subida
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  // Solo exponer nombre generado y ruta relativa segura
  return res.status(200).json({
    message: 'Archivo subido con éxito',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
};

module.exports = {
  uploadFile,
  uploadMiddleware
};
