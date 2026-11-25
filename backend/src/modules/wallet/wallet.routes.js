'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { pagination } = require('../../utils/schemas');
const service = require('./wallet.service');
const { listTransactionsQuery, createWithdrawalSchema } = require('./wallet.validation');

// /api/wallet  (customer)
const router = express.Router();
router.use(authenticate, authorize('customer'));

router.get('/', asyncHandler(async (req, res) => {
  success(res, { wallet: await service.getWallet(req.user.id) });
}));
router.get('/transactions', validate(listTransactionsQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listTransactions(req.user.id, req.query));
}));
router.post('/withdrawals', validate(createWithdrawalSchema), asyncHandler(async (req, res) => {
  success(res, await service.createWithdrawal(req.user.id, req.body), 'Permintaan penarikan dibuat (simulasi)', 201);
}));
router.get('/withdrawals', validate(pagination, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listWithdrawals(req.user.id, req.query));
}));

module.exports = { router };
