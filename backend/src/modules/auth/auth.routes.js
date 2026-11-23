'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../../config/env');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { registerSchema, loginSchema } = require('./auth.validation');
const controller = require('./auth.controller');

const router = express.Router();

// Pembatas percobaan per IP. Catatan: di serverless (Vercel) penghitung ini hidup di memori
// tiap instance, jadi hanya perlindungan dasar, bukan jaminan ketat.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' },
});

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
