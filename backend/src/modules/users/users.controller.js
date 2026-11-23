'use strict';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const usersService = require('./users.service');

const createStaff = asyncHandler(async (req, res) => {
  const user = await usersService.createStaff(req.body);
  success(res, { user }, 'Akun staf berhasil dibuat', 201);
});

module.exports = { createStaff };
