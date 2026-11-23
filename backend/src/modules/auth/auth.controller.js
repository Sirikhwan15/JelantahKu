'use strict';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  success(res, data, 'Registrasi berhasil', 201);
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  success(res, data, 'Login berhasil');
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  success(res, { user });
});

module.exports = { register, login, me };
