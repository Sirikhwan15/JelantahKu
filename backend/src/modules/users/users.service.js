'use strict';
const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { toPublicUser, isEmailTaken } = require('../auth/auth.service');

async function createStaff(input) {
  const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role`,
      [input.name, input.email, passwordHash, input.phone ?? null, input.role],
    );
    return toPublicUser(rows[0]);
  } catch (err) {
    if (isEmailTaken(err)) throw new AppError(409, 'Email sudah terdaftar');
    throw err;
  }
}

module.exports = { createStaff };
