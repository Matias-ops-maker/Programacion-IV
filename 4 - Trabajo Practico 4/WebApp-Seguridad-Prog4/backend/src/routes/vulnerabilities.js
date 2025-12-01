const express = require("express");
const router = express.Router();
const vulnerabilityController = require("../controllers/vulnerabilityController");
const {
  uploadMiddleware,
  uploadFile,
} = require("../controllers/uploadController");
const {
  csrfProtection,
  originCheck,
  csrfErrorHandler,
} = require("../middleware/csrf");

// Command Injection
router.post("/ping", vulnerabilityController.ping);

// CSRF - Transferencia
router.get("/csrf-token", csrfProtection, (req, res) => {
  // Exponer el token CSRF y setear cookie legible por el frontend (no httpOnly)
  const token = req.csrfToken();
  res.cookie("XSRF-TOKEN", token, {
    sameSite: "strict",
    httpOnly: false,
    secure: false,
  });
  return res.status(200).json({ csrfToken: token });
});

router.post(
  "/transfer",
  originCheck,
  csrfProtection,
  vulnerabilityController.transfer
);

// Local File Inclusion
router.get("/file", vulnerabilityController.readFile);

// File Upload
router.post("/upload", uploadMiddleware, uploadFile);

module.exports = router;

// Manejador de errores de CSRF específico para este router
router.use(csrfErrorHandler);
