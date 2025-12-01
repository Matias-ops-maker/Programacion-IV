const csrf = require("csurf");

// Configurar csurf basado en sesión (no requiere cookie-parser)
const csrfProtection = csrf();

// Validación básica de Origin/Referer para endpoints sensibles
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost",
]);

const originCheck = (req, res, next) => {
  const origin = req.get("origin") || req.get("referer");
  if (origin && ![...allowedOrigins].some((o) => origin.startsWith(o))) {
    return res.status(403).json({ error: "Invalid Origin" });
  }
  next();
};

// Manejador de errores específico de CSRF para respuestas JSON
// eslint-disable-next-line no-unused-vars
const csrfErrorHandler = (err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "CSRF token invalid or missing" });
  }
  return next(err);
};

module.exports = {
  csrfProtection,
  originCheck,
  csrfErrorHandler,
};
