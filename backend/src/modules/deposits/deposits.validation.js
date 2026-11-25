'use strict';
const { z } = require('zod');
const { liters, pagination } = require('../../utils/schemas');

const STATUSES = ['pending', 'scheduled', 'completed', 'rejected', 'cancelled'];

const common = {
  estimatedLiters: liters('Estimasi volume', 500),
  preferredAt: z.iso
    .datetime({ offset: true, error: 'Format waktu tidak valid (gunakan ISO 8601)' })
    .refine((v) => new Date(v).getTime() > Date.now() - 5 * 60 * 1000, 'Waktu yang diinginkan tidak boleh di masa lalu')
    .optional(),
  notes: z.string().trim().max(500).optional(),
};

const createDepositSchema = z.discriminatedUnion('method', [
  z
    .object({
      ...common,
      method: z.literal('pickup'),
      pickupAddress: z.string({ error: 'Alamat penjemputan wajib diisi' }).trim().min(5, 'Alamat minimal 5 karakter').max(500),
      pickupLatitude: z.number().min(-90).max(90).optional(),
      pickupLongitude: z.number().min(-180).max(180).optional(),
    })
    .refine(
      (v) => (v.pickupLatitude === undefined) === (v.pickupLongitude === undefined),
      'Latitude dan longitude harus diisi berpasangan',
    ),
  z.object({
    ...common,
    method: z.literal('dropoff'),
    dropPointId: z.number({ error: 'Titik pengumpulan wajib dipilih' }).int().positive(),
  }),
], { error: 'method harus "pickup" atau "dropoff"' });

const listDepositsQuery = pagination.extend({
  status: z.enum(STATUSES, { error: 'status tidak valid' }).optional(),
});

module.exports = { createDepositSchema, listDepositsQuery, STATUSES };
