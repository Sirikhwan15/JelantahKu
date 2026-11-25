'use strict';
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num, round2, paged } = require('../../utils/format');
const { mapDeposit, listDeposits } = require('../deposits/deposits.shared');
const { mapWithdrawal } = require('../wallet/wallet.service');
const { getSettings } = require('../settings/settings.service');
const { computeImpact } = require('../impact/impact.service');
const wallet = require('../wallet/wallet.repository');

async function listDepositsAdmin({ status, page, limit }) {
  const params = [];
  let whereSql = 'TRUE';
  if (status) {
    params.push(status);
    whereSql = 'd.status = $1';
  }
  return listDeposits({
    whereSql,
    params,
    orderSql: 'd.created_at DESC, d.id DESC',
    page,
    limit,
    mapRow: (r) => ({
      ...mapDeposit(r),
      customer: { id: r.user_id, name: r.customer_name, email: r.customer_email, role: r.customer_role },
    }),
  });
}

/**
 * Ringkasan bisnis. Catatan batas data:
 *  - "stok" = total volume yang pernah terkumpul (belum ada tabel penjualan keluar ke pabrik).
 *  - Margin = SIMULASI: (volume x harga jual pabrik di pengaturan) - total saldo tunai yang dibayarkan.
 *    Biaya operasional/kurir dan nilai poin belum diperhitungkan.
 */
async function getSummary() {
  const [settings, dep, users, wd, monthly] = await Promise.all([
    getSettings(),
    query(
      `SELECT COALESCE(SUM(actual_liters) FILTER (WHERE status = 'completed'), 0) AS total_liters,
              COALESCE(SUM(cash_awarded)  FILTER (WHERE status = 'completed'), 0) AS cash_paid,
              COALESCE(SUM(points_awarded) FILTER (WHERE status = 'completed'), 0) AS points_issued,
              COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
              COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
              COUNT(*) FILTER (WHERE status = 'completed') AS completed,
              COUNT(*) FILTER (WHERE status = 'rejected')  AS rejected,
              COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
       FROM deposits`,
    ),
    query('SELECT role, COUNT(*) AS n FROM users GROUP BY role'),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
              COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount
       FROM withdrawals`,
    ),
    query(
      `SELECT to_char(date_trunc('month', completed_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM') AS month,
              SUM(actual_liters) AS liters, COUNT(*) AS deposits
       FROM deposits
       WHERE status = 'completed'
         AND (completed_at AT TIME ZONE 'Asia/Jakarta') >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '5 months'
       GROUP BY 1 ORDER BY 1`,
    ),
  ]);

  const d = dep.rows[0];
  const totalLiters = Number(d.total_liters);
  const cashPaid = Number(d.cash_paid);
  const revenue = round2(totalLiters * settings.factorySellPricePerLiter);
  const margin = round2(revenue - cashPaid);

  return {
    collected: {
      totalLiters: round2(totalLiters),
      note: 'Total volume yang pernah terkumpul (belum dikurangi penjualan ke pabrik).',
    },
    deposits: {
      pending: d.pending, scheduled: d.scheduled, completed: d.completed, rejected: d.rejected, cancelled: d.cancelled,
    },
    payouts: { cashPaid: round2(cashPaid), pointsIssued: d.points_issued },
    marginSimulation: {
      isSimulation: true,
      factorySellPricePerLiter: settings.factorySellPricePerLiter,
      estimatedRevenue: revenue,
      cashCost: round2(cashPaid),
      estimatedMargin: margin,
      estimatedMarginPercent: revenue > 0 ? round2((margin / revenue) * 100) : null,
      note: 'Belum termasuk biaya operasional/kurir dan nilai Green Points.',
    },
    environmentalImpact: computeImpact(totalLiters, settings),
    users: Object.fromEntries(users.rows.map((u) => [u.role, u.n])),
    pendingWithdrawals: { count: wd.rows[0].pending_count, amount: num(wd.rows[0].pending_amount) },
    monthly: monthly.rows.map((m) => ({ month: m.month, liters: round2(m.liters), deposits: m.deposits })),
  };
}

async function listWithdrawalsAdmin({ status, page, limit }) {
  const params = [];
  let where = 'TRUE';
  if (status) {
    params.push(status);
    where = 'w.status = $1';
  }
  const total = (await query(`SELECT COUNT(*) AS n FROM withdrawals w WHERE ${where}`, params)).rows[0].n;
  const listParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `SELECT w.*, u.name AS user_name, u.email AS user_email
     FROM withdrawals w JOIN users u ON u.id = w.user_id
     WHERE ${where} ORDER BY w.created_at DESC, w.id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );
  const items = rows.map((r) => ({ ...mapWithdrawal(r), user: { id: r.user_id, name: r.user_name, email: r.user_email } }));
  return paged(items, total, { page, limit });
}

/** Simulasi pencairan: "paid" = dianggap sudah ditransfer; "rejected" = saldo dikembalikan + mutasi refund. */
async function processWithdrawal(adminId, id, { status }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE', [id]);
    const w = rows[0];
    if (!w) throw new AppError(404, 'Permintaan penarikan tidak ditemukan');
    if (w.status !== 'pending') throw new AppError(409, `Permintaan ini sudah berstatus "${w.status}"`);

    const upd = await client.query(
      `UPDATE withdrawals SET status = $2, processed_by = $3, processed_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status, adminId],
    );

    if (status === 'rejected') {
      const balance = await wallet.credit(client, w.user_id, { cash: w.amount, points: 0 });
      await wallet.addLedger(client, {
        userId: w.user_id, asset: 'cash', type: 'withdrawal_refund', amount: w.amount,
        balanceAfter: balance.cash_balance, withdrawalId: id, description: `Pengembalian penarikan #${id} (ditolak)`,
      });
    }
    return { withdrawal: mapWithdrawal(upd.rows[0]) };
  });
}

// Status "expired" dihitung saat dibaca: voucher aktif yang masa berlakunya sudah lewat.
const VOUCHER_STATUS_SQL = `CASE WHEN rr.status = 'active' AND rr.expires_at IS NOT NULL AND rr.expires_at < NOW()
                                  THEN 'expired' ELSE rr.status::text END`;

const mapVoucher = (r) => ({
  id: r.id,
  code: r.voucher_code,
  status: r.effective_status,
  rewardName: r.reward_name,
  partnerName: r.partner_name,
  pointsSpent: r.points_spent,
  customer: { id: r.user_id, name: r.user_name, email: r.user_email },
  expiresAt: r.expires_at,
  usedAt: r.used_at,
  createdAt: r.created_at,
});

const VOUCHER_SELECT = `
  SELECT rr.*, ${VOUCHER_STATUS_SQL} AS effective_status,
         r.name AS reward_name, r.partner_name, u.name AS user_name, u.email AS user_email
  FROM reward_redemptions rr
  JOIN rewards r ON r.id = rr.reward_id
  JOIN users u   ON u.id = rr.user_id`;

async function listVouchers({ status, code, page, limit }) {
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`(${VOUCHER_STATUS_SQL}) = $${params.length}`);
  }
  if (code) {
    params.push(`%${code}%`); // kode sudah divalidasi hanya A-Z, 0-9, "-" (tanpa wildcard)
    where.push(`rr.voucher_code ILIKE $${params.length}`);
  }
  const whereSql = where.length ? where.join(' AND ') : 'TRUE';
  const total = (await query(`SELECT COUNT(*) AS n FROM reward_redemptions rr WHERE ${whereSql}`, params)).rows[0].n;
  const listParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `${VOUCHER_SELECT} WHERE ${whereSql} ORDER BY rr.created_at DESC, rr.id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );
  return paged(rows.map(mapVoucher), total, { page, limit });
}

/** Menandai voucher terpakai. UPDATE bersyarat = dua admin tidak bisa "memakai" kode yang sama dua kali. */
async function useVoucher(adminId, code) {
  const upd = await query(
    `UPDATE reward_redemptions
     SET status = 'used', used_at = NOW(), marked_used_by = $2
     WHERE voucher_code = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id`,
    [code, adminId],
  );
  if (!upd.rows[0]) {
    const { rows } = await query(`${VOUCHER_SELECT} WHERE rr.voucher_code = $1`, [code]);
    const v = rows[0];
    if (!v) throw new AppError(404, 'Kode voucher tidak ditemukan');
    if (v.effective_status === 'used') throw new AppError(409, 'Voucher ini sudah terpakai');
    throw new AppError(409, 'Voucher ini sudah kedaluwarsa');
  }
  const { rows } = await query(`${VOUCHER_SELECT} WHERE rr.id = $1`, [upd.rows[0].id]);
  return { voucher: mapVoucher(rows[0]) };
}

module.exports = { listDepositsAdmin, getSummary, listWithdrawalsAdmin, processWithdrawal, listVouchers, useVoucher };
