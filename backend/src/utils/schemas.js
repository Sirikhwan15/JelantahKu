'use strict';
const { z } = require('zod');

const idParam = z.object({
  id: z.coerce.number({ error: 'ID tidak valid' }).int('ID tidak valid').positive('ID tidak valid'),
});

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Volume dalam liter, 2 desimal. Dibulatkan agar tidak ada ekor floating point.
const liters = (label, max = 1000) =>
  z
    .number({ error: `${label} harus berupa angka` })
    .min(0.01, `${label} minimal 0,01 liter`)
    .max(max, `${label} maksimal ${max} liter`)
    .transform((v) => Math.round(v * 100) / 100);

module.exports = { idParam, pagination, liters };
