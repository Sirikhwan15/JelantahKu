'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');

// Hash palsu (cost 10) agar waktu respons login tetap mirip walau email tidak terdaftar.
const DUMMY_HASH = '$2b$10$h1beolAUHuQCHqwqpvrKh.jZyBmDoP6Qq2//WCIi2VJpBY/UZkr6e';

const signToken = (user) =>
  jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });

const toPublicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: row.role,
});

const slugify = (text) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'umkm';

async function uniqueSlug(client, businessName) {
  const base = slugify(businessName);
  const { rows } = await client.query('SELECT 1 FROM umkm_profiles WHERE slug = $1', [base]);
  return rows.length ? `${base}-${crypto.randomBytes(3).toString('hex')}` : base;
}

const isEmailTaken = (err) => err.code === '23505' && err.constraint === 'users_email_lower_key';

async function register(input) {
  const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);

  const user = await withTransaction(async (client) => {
    let row;
    try {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, phone, role`,
        [input.name, input.email, passwordHash, input.phone ?? null, input.accountType],
      );
      row = res.rows[0];
    } catch (err) {
      if (isEmailTaken(err)) throw new AppError(409, 'Email sudah terdaftar');
      throw err;
    }

    await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [row.id]);

    if (input.accountType === 'umkm') {
      const slug = await uniqueSlug(client, input.businessName);
      await client.query(
        `INSERT INTO umkm_profiles (user_id, business_name, business_type, address, slug)
         VALUES ($1, $2, $3, $4, $5)`,
        [row.id, input.businessName, input.businessType ?? null, input.address ?? null, slug],
      );
    }
    return row;
  });

  return { user: toPublicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  const { rows } = await query(
    `SELECT id, name, email, phone, role, is_active, password_hash
     FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  const user = rows[0];

  const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordOk) throw new AppError(401, 'Email atau password salah');
  if (!user.is_active) throw new AppError(403, 'Akun Anda dinonaktifkan. Hubungi admin.');

  return { user: toPublicUser(user), token: signToken(user) };
}

async function getProfile(userId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
            w.cash_balance, w.points_balance,
            p.business_name, p.business_type, p.address AS business_address, p.description AS business_description,
            p.contact_phone, p.contact_email, p.slug, p.badge_verified
     FROM users u
     LEFT JOIN wallets w        ON w.user_id = u.id
     LEFT JOIN umkm_profiles p  ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  const r = rows[0];
  if (!r) throw new AppError(404, 'Pengguna tidak ditemukan');

  return {
    ...toPublicUser(r),
    createdAt: r.created_at,
    // NUMERIC dari pg berupa string ("30000.00"); diubah ke angka untuk tampilan.
    wallet: r.cash_balance === null ? null : {
      cashBalance: Number(r.cash_balance),
      pointsBalance: r.points_balance,
    },
    umkmProfile: r.slug ? {
      businessName: r.business_name,
      businessType: r.business_type,
      address: r.business_address,
      description: r.business_description,
      contactPhone: r.contact_phone,
      contactEmail: r.contact_email,
      slug: r.slug,
      badgeVerified: r.badge_verified,
    } : null,
  };
}

module.exports = { register, login, getProfile, signToken, toPublicUser, isEmailTaken };
