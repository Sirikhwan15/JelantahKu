'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./umkm.service');
const { updateUmkmProfileSchema } = require('./umkm.validation');

// /api/umkm/profile  (akun umkm). Kontak yang diisi di sini TAMPIL PUBLIK di halaman mitra setelah badge terverifikasi.
const router = express.Router();
router.use(authenticate, authorize('umkm'));

router.get('/profile', asyncHandler(async (req, res) => {
  success(res, { profile: await service.getProfile(req.user.id) });
}));
router.patch('/profile', validate(updateUmkmProfileSchema), asyncHandler(async (req, res) => {
  success(res, { profile: await service.updateProfile(req.user.id, req.body) }, 'Profil usaha diperbarui');
}));

module.exports = { router };
