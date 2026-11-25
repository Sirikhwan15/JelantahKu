'use strict';
const { query } = require('../../config/db');
const { num, paged } = require('../../utils/format');

// Kolom customer ikut diambil agar bisa dipakai tampilan kurir / admin.
const DEPOSIT_SELECT = `
  SELECT d.*,
         dp.name AS drop_point_name, dp.address AS drop_point_address,
         c.name  AS courier_name,
         u.name  AS customer_name, u.phone AS customer_phone, u.email AS customer_email, u.role AS customer_role
  FROM deposits d
  LEFT JOIN drop_points dp ON dp.id = d.drop_point_id
  LEFT JOIN users c        ON c.id  = d.courier_id
  JOIN users u             ON u.id  = d.user_id`;

const mapDeposit = (r) => ({
  id: r.id,
  method: r.method,
  status: r.status,
  estimatedLiters: num(r.estimated_liters),
  actualLiters: num(r.actual_liters),
  quality: r.quality,
  pickupAddress: r.pickup_address,
  pickupLatitude: num(r.pickup_latitude),
  pickupLongitude: num(r.pickup_longitude),
  dropPoint: r.drop_point_id
    ? { id: r.drop_point_id, name: r.drop_point_name, address: r.drop_point_address }
    : null,
  preferredAt: r.preferred_at,
  notes: r.notes,
  courier: r.courier_id ? { id: r.courier_id, name: r.courier_name } : null,
  courierNotes: r.courier_notes,
  buyPriceSnapshot: num(r.buy_price_snapshot),
  pointsPerLiterSnapshot: r.points_per_liter_snapshot,
  cashAwarded: num(r.cash_awarded),
  pointsAwarded: r.points_awarded,
  completedAt: r.completed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * Daftar setoran dengan filter + paginasi.
 * whereSql / orderSql disusun dari potongan tetap di kode (bukan input pengguna); nilai lewat params.
 */
async function listDeposits({ whereSql, params, orderSql, page, limit, mapRow = mapDeposit }) {
  const countRes = await query(`SELECT COUNT(*) AS n FROM deposits d WHERE ${whereSql}`, params);
  const total = countRes.rows[0].n;
  const listParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `${DEPOSIT_SELECT} WHERE ${whereSql} ORDER BY ${orderSql} LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );
  return paged(rows.map(mapRow), total, { page, limit });
}

async function findDeposit(whereSql, params) {
  const { rows } = await query(`${DEPOSIT_SELECT} WHERE ${whereSql}`, params);
  return rows[0] || null;
}

module.exports = { DEPOSIT_SELECT, mapDeposit, listDeposits, findDeposit };
