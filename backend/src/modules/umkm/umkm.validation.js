'use strict';
const { z } = require('zod');

// String kosong dianggap "hapus isian" (null). Nilai null menghapus field di database.
const optionalText = (schema) => z.preprocess((v) => (v === '' ? null : v), schema.nullable());

const updateUmkmProfileSchema = z
  .object({
    businessName: z.string().trim().min(2, 'Nama usaha minimal 2 karakter').max(150),
    businessType: optionalText(z.string().trim().max(60)),
    description: optionalText(z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter')),
    address: optionalText(z.string().trim().max(500)),
    contactPhone: optionalText(z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Nomor kontak tidak valid (8-15 digit)')),
    contactEmail: optionalText(
      z.string().trim().toLowerCase().max(255).pipe(z.email({ error: 'Format email kontak tidak valid' })),
    ),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Isi minimal satu field yang ingin diubah');

module.exports = { updateUmkmProfileSchema };
