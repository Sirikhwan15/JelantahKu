'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./settings.service');
const { updateSettingsSchema } = require('./settings.validation');

// GET /api/settings/public  (semua pengguna login)
const router = express.Router();
router.get('/public', authenticate, asyncHandler(async (req, res) => {
  success(res, await service.getPublicSettings());
}));

// /api/admin/settings  (admin)
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('admin'));
adminRouter.get('/', asyncHandler(async (req, res) => success(res, await service.getSettings())));
adminRouter.put('/', validate(updateSettingsSchema), asyncHandler(async (req, res) => {
  success(res, await service.updateSettings(req.user.id, req.body), 'Pengaturan diperbarui');
}));

module.exports = { router, adminRouter };
