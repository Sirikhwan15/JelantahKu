'use strict';
const { z } = require('zod');
const { liters, pagination } = require('../../utils/schemas');

const completeTaskSchema = z.object({
  actualLiters: liters('Volume aktual', 1000),
  quality: z.enum(['layak', 'tercampur_air'], { error: 'quality harus "layak" atau "tercampur_air"' }),
  notes: z.string().trim().max(500).optional(),
});

const listTasksQuery = pagination.extend({
  status: z.enum(['pending', 'scheduled'], { error: 'status harus "pending" atau "scheduled"' }).optional(),
});

module.exports = { completeTaskSchema, listTasksQuery };
