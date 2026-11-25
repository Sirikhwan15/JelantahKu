'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { idParam } = require('../../utils/schemas');
const service = require('./rewards.service');
const { createRewardSchema, updateRewardSchema, listRedemptionsQuery } = require('./rewards.validation');

// /api/rewards  (customer)
const router = express.Router();
router.use(authenticate, authorize('customer'));

router.get('/', asyncHandler(async (req, res) => success(res, { items: await service.listActive() })));
// Didaftarkan sebelum '/:id/redeem' agar "redemptions" tidak dianggap sebagai id
router.get('/redemptions', validate(listRedemptionsQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listRedemptions(req.user.id, req.query));
}));
router.post('/:id/redeem', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  success(res, await service.redeem(req.user.id, req.params.id), 'Penukaran berhasil', 201);
}));

// /api/admin/rewards  (admin). Menonaktifkan = PUT isActive:false
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('admin'));
adminRouter.get('/', asyncHandler(async (req, res) => success(res, { items: await service.listAll() })));
adminRouter.post('/', validate(createRewardSchema), asyncHandler(async (req, res) => {
  success(res, await service.createReward(req.body), 'Reward dibuat', 201);
}));
adminRouter.put('/:id', validate(idParam, 'params'), validate(updateRewardSchema), asyncHandler(async (req, res) => {
  success(res, await service.updateReward(req.params.id, req.body), 'Reward diperbarui');
}));

module.exports = { router, adminRouter };
