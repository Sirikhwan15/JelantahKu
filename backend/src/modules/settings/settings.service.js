'use strict';
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num } = require('../../utils/format');
const { buildSet } = require('../../utils/sql');

const COLUMNS = {
  currentBuyPrice: 'current_buy_price',
  pointsPerLiter: 'points_per_liter',
  waterLitersPerLiterOil: 'water_liters_per_liter_oil',
  co2KgPerLiter: 'co2_kg_per_liter',
  umkmBadgeMinLiters: 'umkm_badge_min_liters',
  minWithdrawalAmount: 'min_withdrawal_amount',
  factorySellPricePerLiter: 'factory_sell_price_per_liter',
};

const mapSettings = (r) => ({
  currentBuyPrice: num(r.current_buy_price),
  pointsPerLiter: r.points_per_liter,
  waterLitersPerLiterOil: num(r.water_liters_per_liter_oil),
  co2KgPerLiter: num(r.co2_kg_per_liter),
  umkmBadgeMinLiters: num(r.umkm_badge_min_liters),
  minWithdrawalAmount: num(r.min_withdrawal_amount),
  factorySellPricePerLiter: num(r.factory_sell_price_per_liter),
  updatedAt: r.updated_at,
});

async function getSettings() {
  const { rows } = await query('SELECT * FROM app_settings WHERE id = 1');
  if (!rows[0]) throw new AppError(500, 'Pengaturan aplikasi belum diinisialisasi (jalankan seed.sql)');
  return mapSettings(rows[0]);
}

/** Dibaca semua pengguna login: hanya yang perlu ditampilkan (tanpa harga jual ke pabrik). */
async function getPublicSettings() {
  const s = await getSettings();
  return {
    currentBuyPrice: s.currentBuyPrice,
    pointsPerLiter: s.pointsPerLiter,
    minWithdrawalAmount: s.minWithdrawalAmount,
    umkmBadgeMinLiters: s.umkmBadgeMinLiters,
  };
}

async function updateSettings(adminId, patch) {
  const { sets, values } = buildSet(patch, COLUMNS);
  values.push(adminId);
  sets.push(`updated_by = $${values.length}`);
  const { rows } = await query(`UPDATE app_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`, values);
  return mapSettings(rows[0]);
}

module.exports = { getSettings, getPublicSettings, updateSettings };
