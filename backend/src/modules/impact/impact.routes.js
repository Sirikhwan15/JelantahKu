'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { z } = require('zod');
const service = require('./impact.service');

// GET /api/impact  (customer)
const router = express.Router();
router.get('/', authenticate, authorize('customer'), asyncHandler(async (req, res) => {
  success(res, { impact: await service.getMyImpact(req.user.id) });
}));

// GET /api/public/umkm/:slug  (tanpa login)
const slugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/, 'Slug tidak valid') });
const publicRouter = express.Router();
publicRouter.get('/umkm/:slug', validate(slugParam, 'params'), asyncHandler(async (req, res) => {
  success(res, { profile: await service.getPublicUmkm(req.params.slug) });
}));

module.exports = { router, publicRouter };
