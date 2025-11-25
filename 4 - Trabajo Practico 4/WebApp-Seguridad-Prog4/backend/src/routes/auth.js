const express = require('express');
const router = express.Router();

const {
  login,
  register,
  verifyToken,
  checkUsername
} = require('../controllers/authController');

const {
  bruteForceLimiter,
  bruteForceDelay,
  bruteForceCaptcha,
  resetFailedAttempts,
  resetRateLimit,
  recordAttempt
} = require('../middleware/bruteForce.js'); 

router.use((req, res, next) => {
  if (!req.app.__brute_reset_done) {
    resetFailedAttempts();
    resetRateLimit();
    req.app.__brute_reset_done = true;
  }
  next();
});

router.post('/login', require('../middleware/bruteForce').recordAttempt, bruteForceLimiter, bruteForceDelay, bruteForceCaptcha, login);
router.post('/register', register);
router.post('/auth/verify', verifyToken);
router.post('/check-username', recordAttempt, bruteForceLimiter, bruteForceDelay, checkUsername);

module.exports = router;
