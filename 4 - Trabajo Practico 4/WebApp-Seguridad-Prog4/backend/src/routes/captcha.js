const express = require('express');
const router = express.Router();
const captchaController = require('../controllers/captchaController');

router.get('/captcha', captchaController.generateCaptcha);
router.post('/verify-captcha', captchaController.verifyCaptcha);

module.exports = router;
