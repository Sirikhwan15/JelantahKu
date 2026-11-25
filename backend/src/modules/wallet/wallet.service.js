'use strict';
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num, paged } = require('../../utils/format');
const repo = require('./wallet.repository');

const mapTx = (r) => ({
  id: r.id,
  asset: r.asset,
  type: r.type,
  amount: num(r.amount),
  balanceAfter: num(r.balance_after),
  depositId: r.deposit_id,
  withdrawalId: r.withdrawal_id,
  redemptionId: r.redemption_id,
  description: r.description,
  createdAt: r.created_at,
});

const mapWithdrawal = (r) => ({
  id: r.id,
  amount: num(r.amount),
  destinationType: r.destination_type,
  destinationProvider: r.destination_provider,
  accountName: r.account_name,
  accountNumber: r.account_number,
  status: r.status,
  processedAt: r.processed_at,
  createdAt: r.created_at,
});

async function getWallet(userId) {
  const { rows } = await query('SELECT cash_balance, points_balance FROM wallets WHERE user_id = $1', [userId]);
  const w = rows[0];
  return { cashBalance: w ? num(w.cash_balance) : 0, pointsBalance: w ? w.points_balance : 0 };
}

async function listTransactions(userId, { asset, page, limit }) {
  const params = [userId];
  let where = 'user_id = $1';
  if (asset) {
    params.push(asset);
    where += ` AND asset = $${params.length}`;
  }
  const total = (await query(`SELECT COUNT(*) AS n FROM wallet_transactions WHERE ${where}`, params)).rows[0].n;
  const listParams = [...params, limit, (page - 1) * limit];
  const { rows } = await query(
    `SELECT * FROM wallet_transactions WHERE ${where}
     ORDER BY created_at DESC, id DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );
  return paged(rows.map(mapTx), total, { page, limit });
}

/**
 * Simulasi tarik dana: saldo langsung dipotong (ditahan) dengan UPDATE bersyarat
 * "cash_balance >= nominal", sehingga dua permintaan bersamaan tidak bisa membuat saldo minus.
 * Bila admin menolak, saldo dikembalikan (lihat admin.service).
 */
async function createWithdrawal(userId, input) {
  return withTransaction(async (client) => {
    const s = await client.query('SELECT min_withdrawal_amount FROM app_settings WHERE id = 1');
    const min = Number(s.rows[0].min_withdrawal_amount);
    if (input.amount < min) {
      throw new AppError(400, `Penarikan minimal Rp${min.toLocaleString('id-ID')}`);
    }

    const balance = await repo.debitCash(client, userId, input.amount);
    if (!balance) throw new AppError(400, 'Saldo tidak mencukupi');

    const { rows } = await client.query(
      `INSERT INTO withdrawals (user_id, amount, destination_type, destination_provider, account_name, account_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, input.amount, input.destinationType, input.destinationProvider, input.accountName, input.accountNumber],
    );
    const w = rows[0];
    await repo.addLedger(client, {
      userId, asset: 'cash', type: 'withdrawal', amount: -input.amount,
      balanceAfter: balance.cash_balance, withdrawalId: w.id, description: `Penarikan dana #${w.id}`,
    });
    return { withdrawal: mapWithdrawal(w), wallet: { cashBalance: num(balance.cash_balance), pointsBalance: balance.points_balance } };
  });
}

async function listWithdrawals(userId, { page, limit }) {
  const total = (await query('SELECT COUNT(*) AS n FROM withdrawals WHERE user_id = $1', [userId])).rows[0].n;
  const { rows } = await query(
    'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3',
    [userId, limit, (page - 1) * limit],
  );
  return paged(rows.map(mapWithdrawal), total, { page, limit });
}

module.exports = { getWallet, listTransactions, createWithdrawal, listWithdrawals, mapWithdrawal };
