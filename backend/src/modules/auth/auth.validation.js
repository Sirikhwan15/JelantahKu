'use strict';
const { z } = require('zod');

const email = z
  .string({ error: 'Email wajib diisi' })
  .trim()
  .toLowerCase()
  .max(255, 'Email terlalu panjang')
  .pipe(z.email({ error: 'Format email tidak valid' }));

// bcrypt hanya memakai 72 byte pertama, jadi batasi panjang dalam BYTE.
const password = z
  .string({ error: 'Password wajib diisi' })
  .min(8, 'Password minimal 8 karakter')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password terlalu panjang (maksimal 72 byte)')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password harus mengandung huruf dan angka');

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{8,15}$/, 'Nomor telepon tidak valid (8-15 digit)')
  .optional();

const name = z
  .string({ error: 'Nama wajib diisi' })
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter');

const baseFields = { name, email, password, phone };

// Role hanya boleh household / umkm saat registrasi publik.
// courier & admin TIDAK bisa mendaftar sendiri (dibuat admin lewat POST /api/users/staff).
const registerSchema = z.discriminatedUnion('accountType', [
  z.object({ ...baseFields, accountType: z.literal('household') }),
  z.object({
    ...baseFields,
    accountType: z.literal('umkm'),
    businessName: z
      .string({ error: 'Nama usaha wajib diisi untuk akun UMKM' })
      .trim()
      .min(2, 'Nama usaha minimal 2 karakter')
      .max(150, 'Nama usaha maksimal 150 karakter'),
    businessType: z.string().trim().max(60).optional(),
    address: z.string().trim().max(500).optional(),
  }),
], { error: 'accountType harus "household" atau "umkm"' });

const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

module.exports = { registerSchema, loginSchema, schemas: { email, password, phone, name } };
