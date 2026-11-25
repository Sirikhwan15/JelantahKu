'use strict';
const crypto = require('crypto');
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num, paged } = require('../../utils/format');
const { buildSet } = require('../../utils/sql');
const wallet = require('../wallet/wallet.repository');

const VOUCHER_VALID_DAYS = 30; // masa berlaku voucher sejak ditukar
// Tanpa karakter yang mudah tertukar (0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const COLUMNS = {
  name: 'name',
  description: 'description',
  partnerName: 'partner_name',
  pointsCost: 'points_cost',
  stock: 'stock',
  imageUrl: 'image_url',
  isActive: 'is_active',
};

const mapReward = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  partnerName: r.partner_name,
  pointsCost: r.points_cost,
  stock: r.stock,
  available: r.is_active && r.stock > 0,
  imageUrl: r.image_url,
  isActive: r.is_active,
});

function generateVoucherCode() {
  const pick = () => Array.from(crypto.randomBytes(4), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `JLK-${pick()}-${pick()}`;
}

const isCodeCollision = (err) => err.code === '23505' && err.constraint === 'reward_redemptions_voucher_code_key';

async function listActive() {
  const { rows } = await query('SELECT * FROM rewards WHERE is_active ORDER BY points_cost, id');
  return rows.map(mapReward);
}

async function listAll() {
  const { rows } = await query('SELECT * FROM rewards ORDER BY is_active DESC, id');
  return rows.map(mapReward);
}

async function createReward(input) {
  const { rows } = await query(
    `INSERT INTO rewards (name, description, partner_name, points_cost, stock, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE)) RETURNING *`,
    [input.name, input.description ?? null, input.partnerName ?? null, input.pointsCost, input.stock, input.imageUrl ?? null, input.isActive ?? null],
  );
  return mapReward(rows[0]);
}

async function updateReward(id, patch) {
  const { sets, values } = buildSet(patch, COLUMNS);
  values.push(id);
  const { rows } = await query(`UPDATE rewards SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  if (!rows[0]) throw new AppError(404, 'Reward tidak ditemukan');
  return mapReward(rows[0]);
}

async function redeemOnce(userId, rewardId) {
  return withTransaction(async (client) => {
    // 1) Kurangi stok secara atomik: hanya berhasil bila reward aktif dan stok > 0
    const stockRes = await client.query(
      `UPDATE rewards SET stock = stock - 1
       WHERE id = $1 AND is_active AND stock > 0
       RETURNING name, partner_name, points_cost`,
      [rewardId],
    );
    const reward = stockRes.rows[0];
    if (!reward) {
      const exists = await client.query('SELECT is_active FROM rewards WHERE id = $1', [rewardId]);
      if (!exists.rows[0] || !exists.rows[0].is_active) throw new AppError(404, 'Reward tidak ditemukan');
      throw new AppError(409, 'Stok reward habis');
    }

    // 2) Potong poin secara atomik: gagal bila poin kurang -> seluruh transaksi (termasuk stok) di-rollback
    const balance = await wallet.debitPoints(client, userId, reward.points_cost);
    if (!balance) throw new AppError(400, 'Poin tidak mencukupi');

    // 3) Voucher + mutasi poin
    const code = generateVoucherCode();
    const { rows } = await client.query(
      `INSERT INTO reward_redemptions (user_id, reward_id, points_spent, voucher_code, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + make_interval(days => $5))
       RETURNING id, voucher_code, status, expires_at, created_at`,
      [userId, rewardId, reward.points_cost, code, VOUCHER_VALID_DAYS],
    );
    const redemption = rows[0];
    await wallet.addLedger(client, {
      userId, asset: 'points', type: 'reward_redeem', amount: -reward.points_cost,
      balanceAfter: balance.points_balance, redemptionId: redemption.id, description: `Tukar poin: ${reward.name}`,
    });

    return {
      voucher: {
        id: redemption.id,
        code: redemption.voucher_code,
        status: redemption.status,
        expiresAt: redemption.expires_at,
        rewardName: reward.name,
        partnerName: reward.partner_name,
        pointsSpent: reward.points_cost,
      },
      wallet: { cashBalance: num(balance.cash_balance), pointsBalance: balance.points_balance },
    };
  });
}

async function redeem(userId, rewardId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await redeemOnce(userId, rewardId);
    } catch (err) {
      if (!isCodeCollision(err) || attempt === 3) throw err; // kode kembar (sangat jarang): coba kode baru
    }
  }
  return null;
}

async function listRedemptions(userId, { page, limit }) {
  const total = (await query('SELECT COUNT(*) AS n FROM reward_redemptions WHERE user_id = $1', [userId])).rows[0].n;
  const { rows } = await query(
    `SELECT rr.id, rr.voucher_code, rr.status, rr.points_spent, rr.expires_at, rr.used_at, rr.created_at,
            r.name AS reward_name, r.partner_name
     FROM reward_redemptions rr JOIN rewards r ON r.id = rr.reward_id
     WHERE rr.user_id = $1
     ORDER BY rr.created_at DESC, rr.id DESC LIMIT $2 OFFSET $3`,
    [userId, limit, (page - 1) * limit],
  );
  const items = rows.map((r) => ({
    id: r.id,
    code: r.voucher_code,
    // status "expired" dihitung saat dibaca bila masa berlaku lewat dan voucher belum dipakai
    status: r.status === 'active' && r.expires_at && new Date(r.expires_at) < new Date() ? 'expired' : r.status,
    rewardName: r.reward_name,
    partnerName: r.partner_name,
    pointsSpent: r.points_spent,
    expiresAt: r.expires_at,
    usedAt: r.used_at,
    createdAt: r.created_at,
  }));
  return paged(items, total, { page, limit });
}

module.exports = { listActive, listAll, createReward, updateReward, redeem, listRedemptions };
