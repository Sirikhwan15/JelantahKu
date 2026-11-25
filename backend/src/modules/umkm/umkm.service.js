'use strict';
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { buildSet } = require('../../utils/sql');

const COLUMNS = {
  businessName: 'business_name',
  businessType: 'business_type',
  description: 'description',
  address: 'address',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
};

const mapProfile = (r) => ({
  businessName: r.business_name,
  businessType: r.business_type,
  description: r.description,
  address: r.address,
  contactPhone: r.contact_phone,
  contactEmail: r.contact_email,
  slug: r.slug,
  badgeVerified: r.badge_verified,
});

async function getProfile(userId) {
  const { rows } = await query('SELECT * FROM umkm_profiles WHERE user_id = $1', [userId]);
  if (!rows[0]) throw new AppError(404, 'Profil UMKM tidak ditemukan');
  return mapProfile(rows[0]);
}

/** Slug sengaja TIDAK ikut berubah saat nama usaha diganti, supaya tautan publik tetap stabil. */
async function updateProfile(userId, patch) {
  const { sets, values } = buildSet(patch, COLUMNS);
  values.push(userId);
  const { rows } = await query(
    `UPDATE umkm_profiles SET ${sets.join(', ')} WHERE user_id = $${values.length} RETURNING *`,
    values,
  );
  if (!rows[0]) throw new AppError(404, 'Profil UMKM tidak ditemukan');
  return mapProfile(rows[0]);
}

module.exports = { getProfile, updateProfile };
