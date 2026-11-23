'use strict';
const express = require('express');
const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const router = express.Router();

// Cek server + koneksi database (berguna saat debugging Neon / Vercel)
router.get('/health', asyncHandler(async (req, res) => {
  try {
    await query('SELECT 1');
    success(res, { status: 'ok', database: 'connected' }, 'Server berjalan');
  } catch (err) {
    console.error('[health] database error:', err.message);
    res.status(503).json({ success: false, message: 'Database tidak dapat dihubungi' });
  }
}));

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/users.routes'));
// Fase 4: /deposits, /wallet, /rewards, /drop-points, /admin

module.exports = router;
