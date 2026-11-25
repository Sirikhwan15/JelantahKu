'use strict';
const { z } = require('zod');
const { pagination } = require('../../utils/schemas');

const fields = {
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  description: z.string().trim().max(1000),
  partnerName: z.string().trim().max(150),
  pointsCost: z.number({ error: 'Harga poin harus berupa angka' }).int().min(1, 'Harga poin minimal 1').max(10_000_000),
  stock: z.number({ error: 'Stok harus berupa angka' }).int().min(0, 'Stok tidak boleh negatif').max(1_000_000),
  imageUrl: z.string().trim().max(500).pipe(z.url({ protocol: /^https?$/, error: 'imageUrl harus berupa URL http(s)' })),
  isActive: z.boolean(),
};

const createRewardSchema = z.object({
  name: fields.name,
  pointsCost: fields.pointsCost,
  stock: fields.stock,
  description: fields.description.optional(),
  partnerName: fields.partnerName.optional(),
  imageUrl: fields.imageUrl.optional(),
  isActive: fields.isActive.optional(),
});

const updateRewardSchema = z
  .object(fields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Isi minimal satu field yang ingin diubah');

const listRedemptionsQuery = pagination;

module.exports = { createRewardSchema, updateRewardSchema, listRedemptionsQuery };
