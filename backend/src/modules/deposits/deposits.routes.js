'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { idParam } = require('../../utils/schemas');
const service = require('./deposits.service');
const { createDepositSchema, listDepositsQuery } = require('./deposits.validation');

// /api/deposits  (customer: household & umkm)
const router = express.Router();
router.use(authenticate, authorize('customer'));

router.post('/', validate(createDepositSchema), asyncHandler(async (req, res) => {
  success(res, { deposit: await service.create(req.user, req.body) }, 'Pengajuan setor berhasil dibuat', 201);
}));
router.get('/', validate(listDepositsQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.list(req.user.id, req.query));
}));
router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  success(res, { deposit: await service.getOne(req.user.id, req.params.id) });
}));
router.post('/:id/cancel', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  success(res, { deposit: await service.cancel(req.user.id, req.params.id) }, 'Pengajuan dibatalkan');
}));

module.exports = { router };
