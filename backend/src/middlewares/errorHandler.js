'use strict';
const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) =>
  next(new AppError(404, `Rute ${req.method} ${req.originalUrl} tidak ditemukan`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Body JSON rusak / terlalu besar
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Format JSON tidak valid' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Data yang dikirim terlalu besar' });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Error tak terduga: log lengkap di server, pesan generik ke klien.
  console.error('[error]', err);
  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    ...(env.isProduction ? {} : { debug: err.message }),
  });
};

module.exports = { notFound, errorHandler };
