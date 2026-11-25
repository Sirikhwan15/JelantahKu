'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { idParam } = require('../../utils/schemas');
const service = require('./admin.service');
const {
  listAdminDepositsQuery, listAdminWithdrawalsQuery, processWithdrawalSchema, listVouchersQuery, voucherCodeParam,
} = require('./admin.validation');

// /api/admin/...  (admin)
const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/analytics/summary', asyncHandler(async (req, res) => success(res, await service.getSummary())));
router.get('/deposits', validate(listAdminDepositsQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listDepositsAdmin(req.query));
}));
router.get('/withdrawals', validate(listAdminWithdrawalsQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listWithdrawalsAdmin(req.query));
}));
router.patch('/withdrawals/:id', validate(idParam, 'params'), validate(processWithdrawalSchema), asyncHandler(async (req, res) => {
  success(res, await service.processWithdrawal(req.user.id, req.params.id, req.body), 'Permintaan penarikan diproses');
}));

router.get('/vouchers', validate(listVouchersQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listVouchers(req.query));
}));
router.post('/vouchers/:code/use', validate(voucherCodeParam, 'params'), asyncHandler(async (req, res) => {
  success(res, await service.useVoucher(req.user.id, req.params.code), 'Voucher ditandai terpakai');
}));

module.exports = { router };
