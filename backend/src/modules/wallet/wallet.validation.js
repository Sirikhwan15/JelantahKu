'use strict';
const { z } = require('zod');
const { pagination } = require('../../utils/schemas');

const listTransactionsQuery = pagination.extend({
  asset: z.enum(['cash', 'points'], { error: 'asset harus "cash" atau "points"' }).optional(),
});

// Simulasi tarik dana. Nominal Rupiah bulat.
const createWithdrawalSchema = z.object({
  amount: z
    .number({ error: 'Nominal harus berupa angka' })
    .int('Nominal harus bilangan bulat (Rupiah)')
    .positive('Nominal harus lebih dari 0')
    .max(100_000_000, 'Nominal terlalu besar'),
  destinationType: z.enum(['bank', 'ewallet'], { error: 'destinationType harus "bank" atau "ewallet"' }),
  destinationProvider: z.string({ error: 'Nama bank/e-wallet wajib diisi' }).trim().min(2).max(50),
  accountName: z.string({ error: 'Nama pemilik rekening wajib diisi' }).trim().min(2).max(100),
  accountNumber: z
    .string({ error: 'Nomor rekening wajib diisi' })
    .trim()
    .regex(/^[0-9]{6,25}$/, 'Nomor rekening/e-wallet harus 6-25 digit angka'),
});

module.exports = { listTransactionsQuery, createWithdrawalSchema };
