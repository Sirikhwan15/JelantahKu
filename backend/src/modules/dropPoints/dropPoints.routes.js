'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { idParam } = require('../../utils/schemas');
const service = require('./dropPoints.service');
const { createDropPointSchema, updateDropPointSchema } = require('./dropPoints.validation');

// GET /api/drop-points  (semua pengguna login; hanya yang aktif)
const router = express.Router();
router.get('/', authenticate, asyncHandler(async (req, res) => {
  success(res, { items: await service.listActive() });
}));

// /api/admin/drop-points  (admin). Menonaktifkan = PUT isActive:false (tidak ada DELETE agar riwayat setoran utuh)
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('admin'));
adminRouter.get('/', asyncHandler(async (req, res) => success(res, { items: await service.listAll() })));
adminRouter.post('/', validate(createDropPointSchema), asyncHandler(async (req, res) => {
  success(res, await service.create(req.body), 'Titik pengumpulan dibuat', 201);
}));
adminRouter.put('/:id', validate(idParam, 'params'), validate(updateDropPointSchema), asyncHandler(async (req, res) => {
  success(res, await service.update(req.params.id, req.body), 'Titik pengumpulan diperbarui');
}));

module.exports = { router, adminRouter };
