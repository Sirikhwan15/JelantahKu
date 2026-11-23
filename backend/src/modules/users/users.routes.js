'use strict';
const express = require('express');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const { createStaffSchema } = require('./users.validation');
const controller = require('./users.controller');

const router = express.Router();

// Hanya admin yang boleh membuat akun kurir / admin.
router.post('/staff', authenticate, authorize('admin'), validate(createStaffSchema), controller.createStaff);

module.exports = router;
