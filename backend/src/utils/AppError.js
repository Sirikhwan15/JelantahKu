'use strict';

/** Error yang aman ditampilkan ke klien (pesan sengaja ditulis untuk pengguna). */
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = AppError;
