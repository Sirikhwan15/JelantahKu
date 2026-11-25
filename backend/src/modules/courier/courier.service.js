'use strict';
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num } = require('../../utils/format');
const { mapDeposit, listDeposits, findDeposit } = require('../deposits/deposits.shared');
const wallet = require('../wallet/wallet.repository');

/** Tugas ke kurir: nomor telepon customer baru terlihat setelah tugas diambil kurir tersebut. */
const taskMapper = (courierId) => (r) => ({
  ...mapDeposit(r),
  customer: {
    name: r.customer_name,
    phone: r.courier_id === courierId ? r.customer_phone : null,
  },
});

async function listTasks(courierId, { status, page, limit }) {
  const params = [courierId];
  let whereSql = `(d.status = 'pending' OR (d.status = 'scheduled' AND d.courier_id = $1))`;
  if (status) {
    params.push(status);
    whereSql += ` AND d.status = $${params.length}`;
  }
  return listDeposits({
    whereSql,
    params,
    orderSql: 'd.preferred_at ASC NULLS LAST, d.created_at ASC, d.id ASC',
    page,
    limit,
    mapRow: taskMapper(courierId),
  });
}

async function getTask(courierId, id) {
  const row = await findDeposit(
    `d.id = $1 AND (d.status = 'pending' OR d.courier_id = $2)`,
    [id, courierId],
  );
  if (!row) throw new AppError(404, 'Tugas tidak ditemukan');
  return taskMapper(courierId)(row);
}

/** Mengambil tugas dari antrean. UPDATE bersyarat = dua kurir tidak bisa mengambil tugas yang sama. */
async function claim(courierId, id) {
  const { rowCount } = await query(
    `UPDATE deposits SET status = 'scheduled', courier_id = $2
     WHERE id = $1 AND status = 'pending'`,
    [id, courierId],
  );
  if (!rowCount) throw new AppError(409, 'Tugas sudah diambil kurir lain atau tidak tersedia');
  return getTask(courierId, id);
}

/**
 * Validasi lapangan. Semua dalam SATU transaksi dengan baris setoran dikunci (FOR UPDATE):
 * dua permintaan bersamaan untuk setoran yang sama tidak bisa sama-sama membayar.
 *  - quality "layak"         -> completed, saldo + poin masuk, 2 baris mutasi, cek Green Merchant Badge
 *  - quality "tercampur_air" -> rejected, TIDAK ada saldo/poin
 */
async function complete(courierId, id, { actualLiters, quality, notes }) {
  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT id, user_id, status, courier_id FROM deposits WHERE id = $1 FOR UPDATE',
      [id],
    );
    const deposit = rows[0];
    if (!deposit) throw new AppError(404, 'Tugas tidak ditemukan');
    if (!['pending', 'scheduled'].includes(deposit.status)) {
      throw new AppError(409, `Setoran ini sudah berstatus "${deposit.status}"`);
    }
    if (deposit.courier_id && deposit.courier_id !== courierId) {
      throw new AppError(403, 'Tugas ini ditangani kurir lain');
    }

    // --- Minyak tercampur air: ditolak, tanpa pembayaran
    if (quality === 'tercampur_air') {
      await client.query(
        `UPDATE deposits
         SET status = 'rejected', courier_id = $2, actual_liters = $3, quality = 'tercampur_air', courier_notes = $4
         WHERE id = $1`,
        [id, courierId, actualLiters, notes ?? null],
      );
      return { outcome: 'rejected', reward: null, badgeAwarded: false };
    }

    // --- Minyak layak: hitung dengan NUMERIC di database (bukan float JavaScript)
    const calcRes = await client.query(
      `SELECT current_buy_price, points_per_liter,
              ROUND($1::numeric * current_buy_price, 2) AS cash,
              FLOOR($1::numeric * points_per_liter)::int AS points
       FROM app_settings WHERE id = 1`,
      [actualLiters],
    );
    const calc = calcRes.rows[0];
    if (!calc) throw new AppError(500, 'Pengaturan aplikasi belum diinisialisasi');

    await client.query(
      `UPDATE deposits
       SET status = 'completed', courier_id = $2, actual_liters = $3, quality = 'layak', courier_notes = $4,
           buy_price_snapshot = $5, points_per_liter_snapshot = $6,
           cash_awarded = $7, points_awarded = $8, completed_at = NOW()
       WHERE id = $1`,
      [id, courierId, actualLiters, notes ?? null, calc.current_buy_price, calc.points_per_liter, calc.cash, calc.points],
    );

    const balance = await wallet.credit(client, deposit.user_id, { cash: calc.cash, points: calc.points });
    const description = `Setoran jelantah #${id} (${actualLiters} L)`;
    await wallet.addLedger(client, {
      userId: deposit.user_id, asset: 'cash', type: 'deposit_reward',
      amount: calc.cash, balanceAfter: balance.cash_balance, depositId: id, description,
    });
    await wallet.addLedger(client, {
      userId: deposit.user_id, asset: 'points', type: 'deposit_reward',
      amount: calc.points, balanceAfter: balance.points_balance, depositId: id, description,
    });

    // Green Merchant Badge: otomatis saat total volume UMKM mencapai ambang di app_settings
    // (UPDATE hanya mengenai akun yang punya umkm_profiles; badge yang sudah ada tidak dicabut).
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(actual_liters), 0) AS total FROM deposits WHERE user_id = $1 AND status = 'completed'`,
      [deposit.user_id],
    );
    const badge = await client.query(
      `UPDATE umkm_profiles
       SET badge_verified = TRUE, badge_verified_at = NOW()
       WHERE user_id = $1 AND badge_verified = FALSE
         AND $2::numeric >= (SELECT umkm_badge_min_liters FROM app_settings WHERE id = 1)`,
      [deposit.user_id, totalRes.rows[0].total],
    );

    return {
      outcome: 'completed',
      reward: {
        cash: num(calc.cash),
        points: calc.points,
        customerBalance: { cashBalance: num(balance.cash_balance), pointsBalance: balance.points_balance },
      },
      badgeAwarded: badge.rowCount > 0,
    };
  });

  const task = await getTask(courierId, id);
  return { deposit: task, ...result };
}

module.exports = { listTasks, getTask, claim, complete };
