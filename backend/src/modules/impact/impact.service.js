'use strict';
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num, round2 } = require('../../utils/format');
const { getSettings } = require('../settings/settings.service');

/**
 * Semua angka dampak adalah ESTIMASI. Faktornya dibaca dari app_settings saat ini
 * (bukan snapshot), jadi bila faktor dikoreksi admin, seluruh dashboard ikut terhitung ulang.
 */
const computeImpact = (totalLiters, s) => ({
  totalLiters: round2(totalLiters),
  estimatedWaterProtectedLiters: round2(totalLiters * s.waterLitersPerLiterOil),
  estimatedCo2AvoidedKg: round2(totalLiters * s.co2KgPerLiter),
  assumptions: {
    isEstimate: true,
    waterLitersPerLiterOil: s.waterLitersPerLiterOil,
    co2KgPerLiter: s.co2KgPerLiter,
  },
});

async function getMyImpact(userId) {
  const [settings, agg, profile] = await Promise.all([
    getSettings(),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
              COUNT(*) FILTER (WHERE status = 'rejected')  AS rejected_count,
              COALESCE(SUM(actual_liters) FILTER (WHERE status = 'completed'), 0) AS total_liters
       FROM deposits WHERE user_id = $1`,
      [userId],
    ),
    query('SELECT slug, badge_verified, badge_verified_at FROM umkm_profiles WHERE user_id = $1', [userId]),
  ]);
  const a = agg.rows[0];
  const total = Number(a.total_liters);

  const result = {
    ...computeImpact(total, settings),
    completedDeposits: a.completed_count,
    rejectedDeposits: a.rejected_count,
    badge: null,
  };

  if (profile.rows[0]) {
    const p = profile.rows[0];
    result.badge = {
      verified: p.badge_verified,
      verifiedAt: p.badge_verified_at,
      requiredLiters: settings.umkmBadgeMinLiters,
      progressLiters: round2(total),
      remainingLiters: round2(Math.max(0, settings.umkmBadgeMinLiters - total)),
      publicProfileSlug: p.badge_verified ? p.slug : null,
    };
  }
  return result;
}

/**
 * Halaman publik UMKM: hanya tersedia bila Green Merchant Badge sudah terverifikasi.
 * Data akun (email login, telepon akun) TIDAK pernah ikut; hanya alamat & kontak usaha yang diisi sendiri pemiliknya.
 */
async function getPublicUmkm(slug) {
  const { rows } = await query(
    `SELECT p.business_name, p.business_type, p.description, p.address, p.contact_phone, p.contact_email,
            p.slug, p.badge_verified_at, u.created_at AS member_since,
            COALESCE((SELECT SUM(actual_liters) FROM deposits WHERE user_id = p.user_id AND status = 'completed'), 0) AS total_liters,
            (SELECT COUNT(*) FROM deposits WHERE user_id = p.user_id AND status = 'completed') AS completed_count
     FROM umkm_profiles p JOIN users u ON u.id = p.user_id
     WHERE p.slug = $1 AND p.badge_verified AND u.is_active`,
    [slug],
  );
  const r = rows[0];
  if (!r) throw new AppError(404, 'Profil mitra tidak ditemukan');
  const settings = await getSettings();
  return {
    businessName: r.business_name,
    businessType: r.business_type,
    description: r.description,
    address: r.address,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    slug: r.slug,
    badgeVerifiedAt: r.badge_verified_at,
    memberSince: r.member_since,
    completedDeposits: r.completed_count,
    ...computeImpact(num(r.total_liters), settings),
  };
}

module.exports = { getMyImpact, getPublicUmkm, computeImpact };
