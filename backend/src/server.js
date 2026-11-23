'use strict';
// Entry point untuk development / server biasa. Di Vercel dipakai api/index.js.
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');

const server = app.listen(env.port, () => {
  console.log(`[server] JelantahKu API berjalan di http://localhost:${env.port}/api (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`[server] ${signal} diterima, menutup server...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
