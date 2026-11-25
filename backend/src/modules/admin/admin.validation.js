'use strict';
const { z } = require('zod');
const { pagination } = require('../../utils/schemas');

const listAdminDepositsQuery = pagination.extend({
  status: z.enum(['pending', 'scheduled', 'completed', 'rejected', 'cancelled'], { error: 'status tidak valid' }).optional(),
});

const listAdminWithdrawalsQuery = pagination.extend({
  status: z.enum(['pending', 'paid', 'rejected'], { error: 'status tidak valid' }).optional(),
});

const processWithdrawalSchema = z.object({
  status: z.enum(['paid', 'rejected'], { error: 'status harus "paid" atau "rejected"' }),
});

const listVouchersQuery = pagination.extend({
  status: z.enum(['active', 'used', 'expired'], { error: 'status harus "active", "used", atau "expired"' }).optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,20}$/, 'Kode hanya boleh huruf, angka, dan tanda hubung').optional(),
});

// Kode voucher dinormalkan ke huruf besar sebelum divalidasi formatnya.
const voucherCodeParam = z.object({
  code: z.string().trim().toUpperCase().regex(/^JLK-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'Format kode voucher tidak valid (JLK-XXXX-XXXX)'),
});

module.exports = { listAdminDepositsQuery, listAdminWithdrawalsQuery, processWithdrawalSchema, listVouchersQuery, voucherCodeParam };
