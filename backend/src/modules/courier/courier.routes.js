'use strict';
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const { idParam } = require('../../utils/schemas');
const service = require('./courier.service');
const { completeTaskSchema, listTasksQuery } = require('./courier.validation');

// /api/courier  (kurir)
const router = express.Router();
router.use(authenticate, authorize('courier'));

router.get('/tasks', validate(listTasksQuery, 'query'), asyncHandler(async (req, res) => {
  success(res, await service.listTasks(req.user.id, req.query));
}));
router.get('/tasks/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  success(res, { task: await service.getTask(req.user.id, req.params.id) });
}));
router.post('/tasks/:id/claim', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  success(res, { task: await service.claim(req.user.id, req.params.id) }, 'Tugas diambil');
}));
router.post('/tasks/:id/complete', validate(idParam, 'params'), validate(completeTaskSchema), asyncHandler(async (req, res) => {
  const data = await service.complete(req.user.id, req.params.id, req.body);
  const message = data.outcome === 'completed'
    ? 'Setoran divalidasi. Saldo dan poin customer sudah masuk.'
    : 'Minyak tercampur air: setoran ditolak, tidak ada saldo atau poin yang dikreditkan.';
  success(res, data, message);
}));

module.exports = { router };
