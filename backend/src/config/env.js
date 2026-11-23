'use strict';
const path = require('path');

// Membaca backend/.env saat lokal. Di Vercel tidak ada file .env,
// variabel datang dari Project Settings -> Environment Variables.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const problems = [];

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    problems.push(`${name} belum diisi`);
    return '';
  }
  return value.trim();
}

function toInt(name, fallback, { min, max } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
    problems.push(`${name} harus bilangan bulat${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` dan <= ${max}` : ''}`);
    return fallback;
  }
  return n;
}

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toInt('PORT', 5000, { min: 1, max: 65535 }),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: toInt('BCRYPT_SALT_ROUNDS', 10, { min: 8, max: 14 }),
  authRateLimitMax: toInt('AUTH_RATE_LIMIT_MAX', 20, { min: 1 }), // percobaan login/register per 15 menit per IP
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

if (env.jwtSecret && env.jwtSecret.length < 32) {
  problems.push('JWT_SECRET minimal 32 karakter (buat dengan crypto.randomBytes(48).toString("hex"))');
}

if (problems.length) {
  throw new Error(`Konfigurasi .env tidak valid:\n - ${problems.join('\n - ')}`);
}

module.exports = env;
