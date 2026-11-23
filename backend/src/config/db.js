'use strict';
const { Pool, types } = require('pg');
const env = require('./env');

// BIGINT (id, COUNT) dari pg berupa string; ubah ke angka agar id konsisten di JSON.
// NUMERIC (uang) SENGAJA dibiarkan string supaya tidak ada galat pembulatan; ubah saat ditampilkan.
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

// Neon: gunakan connection string "pooled" (host berisi -pooler) dan sslmode=require.
const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.isProduction ? 5 : 10, // function serverless: kecil agar tidak menghabiskan koneksi
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('[db] error pada koneksi idle:', err.message);
});

/** Query biasa. Selalu pakai parameter ($1, $2) - JANGAN menyambung string. */
const query = (text, params) => pool.query(text, params);

/** Menjalankan beberapa query dalam satu transaksi (otomatis COMMIT / ROLLBACK). */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[db] rollback gagal:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
