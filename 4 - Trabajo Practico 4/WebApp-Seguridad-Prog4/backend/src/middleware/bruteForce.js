
// intentos fallidos por IP
const failedAttempts = {};
// Contador de intentos 
const attemptCounts = {};

// Middleware para registrar un intento 
function recordAttempt(req, res, next) {
  const ip = req.ip;
  attemptCounts[ip] = (attemptCounts[ip] || 0) + 1;
  next();
}

function bruteForceLimiter(req, res, next) {
  const ip = req.ip;
  const attempts = attemptCounts[ip] || 0;
  // límite de 5 intentos; a partir del 6 devuelve 429
  if (attempts > 5) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}

// Delay progresivo por intentos fallidos
async function bruteForceDelay(req, res, next) {
  const ip = req.ip;

  // aplicar delay progresivo a partir del 2 intento
  const attempts = attemptCounts[ip] || 0;
  if (attempts > 1) {
    const delay = Math.min(300 * Math.pow(2, attempts - 2), 8000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  next();
}

//CAPTCHA después de 3 intentos fallidos
function bruteForceCaptcha(req, res, next) {
  const ip = req.ip;

  const attempts = attemptCounts[ip] || failedAttempts[ip] || 0;

  // Requerir CAPTCHA en el siguiente intento después de 3 intentos (es decir, a partir del 4º)
  if (attempts > 3 && !req.body.captcha) {
    return res.status(400).json({ error: "Se requiere verificación captcha" });
  }

  next();
}

module.exports = {
  bruteForceLimiter,
  bruteForceDelay,
  bruteForceCaptcha,
  failedAttempts,
  recordAttempt,
  // Resetea el contador de intentos fallidos 
  resetFailedAttempts: () => {
    for (const k in failedAttempts) {
      delete failedAttempts[k];
    }
    for (const k in attemptCounts) {
      delete attemptCounts[k];
    }
  }
  ,
  // Reset del contador del rate limiter 
  resetRateLimit: () => {
    // Limpiar contador interno de attempts
    for (const k in attemptCounts) delete attemptCounts[k];
  }
};
