'use strict';
const { z } = require('zod');

const updateSettingsSchema = z
  .object({
    currentBuyPrice: z.number().min(0).max(1_000_000, 'Harga beli maksimal Rp1.000.000/liter'),
    pointsPerLiter: z.number().int().min(0).max(10_000),
    waterLitersPerLiterOil: z.number().min(0).max(100_000),
    co2KgPerLiter: z.number().min(0).max(100),
    umkmBadgeMinLiters: z.number().min(0).max(1_000_000),
    minWithdrawalAmount: z.number().int().min(0).max(100_000_000),
    factorySellPricePerLiter: z.number().min(0).max(1_000_000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Isi minimal satu pengaturan yang ingin diubah');

module.exports = { updateSettingsSchema };
