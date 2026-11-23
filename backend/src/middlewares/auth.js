'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Memverifikasi JWT (header "Authorization: Bearer <token>"), lalu memuat user TERBARU dari
 * database. Dengan begitu perubahan role / penonaktifan akun langsung berlaku tanpa menunggu
 * token kedaluwarsa. Biayanya satu query berindeks (primary key) per request.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Autentikasi diperlukan');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    throw new AppError(401, 'Token tidak valid atau sudah kedaluwarsa');
  }

  const { rows } = await query(
    'SELECT id, name, email, phone, role, is_active FROM users WHERE id = $1',
    [payload.sub],
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    throw new AppError(401, 'Akun tidak ditemukan atau dinonaktifkan');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
