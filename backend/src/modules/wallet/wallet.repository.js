'use strict';

/**
 * SATU-SATUNYA pintu perubahan saldo. Semua fungsi menerima `client` dari withTransaction,
 * jadi perubahan saldo dan baris mutasi selalu commit/rollback bersama.
 */

/** Menambah saldo (kredit). Membuat wallet bila belum ada. Mengembalikan saldo baru. */
async function credit(client, userId, { cash = '0', points = 0 }) {
  const { rows } = await client.query(
    `INSERT INTO wallets (user_id, cash_balance, points_balance) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET cash_balance   = wallets.cash_balance   + EXCLUDED.cash_balance,
           points_balance = wallets.points_balance + EXCLUDED.points_balance
     RETURNING cash_balance, points_balance`,
    [userId, cash, points],
  );
  return rows[0];
}

/** Mengurangi saldo tunai secara atomik. Mengembalikan null bila saldo tidak cukup. */
async function debitCash(client, userId, amount) {
  const { rows } = await client.query(
    `UPDATE wallets SET cash_balance = cash_balance - $2
     WHERE user_id = $1 AND cash_balance >= $2
     RETURNING cash_balance, points_balance`,
    [userId, amount],
  );
  return rows[0] || null;
}

/** Mengurangi poin secara atomik. Mengembalikan null bila poin tidak cukup. */
async function debitPoints(client, userId, points) {
  const { rows } = await client.query(
    `UPDATE wallets SET points_balance = points_balance - $2
     WHERE user_id = $1 AND points_balance >= $2
     RETURNING cash_balance, points_balance`,
    [userId, points],
  );
  return rows[0] || null;
}

/** Mencatat satu baris mutasi. amount bertanda (+ masuk, - keluar). */
async function addLedger(client, { userId, asset, type, amount, balanceAfter, depositId, withdrawalId, redemptionId, description }) {
  if (Number(amount) === 0) return; // tabel melarang amount = 0
  await client.query(
    `INSERT INTO wallet_transactions
       (user_id, asset, type, amount, balance_after, deposit_id, withdrawal_id, redemption_id, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, asset, type, amount, balanceAfter, depositId ?? null, withdrawalId ?? null, redemptionId ?? null, description ?? null],
  );
}

module.exports = { credit, debitCash, debitPoints, addLedger };
