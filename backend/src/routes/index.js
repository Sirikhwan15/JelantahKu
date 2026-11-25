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

const settings = require('../modules/settings/settings.routes');
const dropPoints = require('../modules/dropPoints/dropPoints.routes');
const rewards = require('../modules/rewards/rewards.routes');
const impact = require('../modules/impact/impact.routes');

// Publik / semua pengguna login
router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/users.routes'));
router.use('/settings', settings.router);
router.use('/drop-points', dropPoints.router);
router.use('/public', impact.publicRouter);

// Customer (household & umkm)
router.use('/deposits', require('../modules/deposits/deposits.routes').router);
router.use('/wallet', require('../modules/wallet/wallet.routes').router);
router.use('/rewards', rewards.router);
router.use('/impact', impact.router);
router.use('/umkm', require('../modules/umkm/umkm.routes').router);

// Kurir
router.use('/courier', require('../modules/courier/courier.routes').router);

// Admin (rute spesifik didaftarkan sebelum '/admin' umum)
router.use('/admin/settings', settings.adminRouter);
router.use('/admin/drop-points', dropPoints.adminRouter);
router.use('/admin/rewards', rewards.adminRouter);
router.use('/admin', require('../modules/admin/admin.routes').router);

module.exports = router;
