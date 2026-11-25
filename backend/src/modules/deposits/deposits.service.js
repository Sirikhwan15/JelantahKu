'use strict';
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { mapDeposit, listDeposits, findDeposit } = require('./deposits.shared');

// Batas pengajuan aktif per pengguna (anti-spam). Ubah sesuai kebutuhan.
const MAX_OPEN_DEPOSITS = 5;

async function create(user, input) {
  if (input.method === 'dropoff') {
    const dp = await query('SELECT 1 FROM drop_points WHERE id = $1 AND is_active', [input.dropPointId]);
    if (!dp.rows.length) throw new AppError(400, 'Titik pengumpulan tidak ditemukan atau tidak aktif');
  }

  const open = await query(
    `SELECT COUNT(*) AS n FROM deposits WHERE user_id = $1 AND status IN ('pending', 'scheduled')`,
    [user.id],
  );
  if (open.rows[0].n >= MAX_OPEN_DEPOSITS) {
    throw new AppError(409, `Anda masih memiliki ${MAX_OPEN_DEPOSITS} pengajuan aktif. Selesaikan atau batalkan dulu.`);
  }

  const { rows } = await query(
    `INSERT INTO deposits
       (user_id, method, drop_point_id, pickup_address, pickup_latitude, pickup_longitude,
        estimated_liters, preferred_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      user.id,
      input.method,
      input.method === 'dropoff' ? input.dropPointId : null,
      input.method === 'pickup' ? input.pickupAddress : null,
      input.pickupLatitude ?? null,
      input.pickupLongitude ?? null,
      input.estimatedLiters,
      input.preferredAt ?? null,
      input.notes ?? null,
    ],
  );
  return getOne(user.id, rows[0].id);
}

async function list(userId, { status, page, limit }) {
  const params = [userId];
  let whereSql = 'd.user_id = $1';
  if (status) {
    params.push(status);
    whereSql += ` AND d.status = $${params.length}`;
  }
  return listDeposits({ whereSql, params, orderSql: 'd.created_at DESC, d.id DESC', page, limit });
}

async function getOne(userId, id) {
  const row = await findDeposit('d.id = $1 AND d.user_id = $2', [id, userId]);
  if (!row) throw new AppError(404, 'Setoran tidak ditemukan');
  return mapDeposit(row);
}

async function cancel(userId, id) {
  const { rowCount } = await query(
    `UPDATE deposits SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'scheduled')`,
    [id, userId],
  );
  if (!rowCount) {
    const exists = await query('SELECT status FROM deposits WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!exists.rows[0]) throw new AppError(404, 'Setoran tidak ditemukan');
    throw new AppError(409, `Setoran berstatus "${exists.rows[0].status}" dan tidak dapat dibatalkan`);
  }
  return getOne(userId, id);
}

module.exports = { create, list, getOne, cancel };
