'use strict';
const { z } = require('zod');
const { schemas } = require('../auth/auth.validation');

// Dipakai admin untuk membuat akun kurir / admin baru.
const createStaffSchema = z.object({
  name: schemas.name,
  email: schemas.email,
  password: schemas.password,
  phone: schemas.phone,
  role: z.enum(['courier', 'admin'], { error: 'role harus "courier" atau "admin"' }),
});

module.exports = { createStaffSchema };
