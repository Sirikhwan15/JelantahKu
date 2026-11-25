'use strict';
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { num } = require('../../utils/format');
const { buildSet } = require('../../utils/sql');

const COLUMNS = {
  name: 'name',
  address: 'address',
  latitude: 'latitude',
  longitude: 'longitude',
  operatingHours: 'operating_hours',
  contactPhone: 'contact_phone',
  isActive: 'is_active',
};

const map = (r) => ({
  id: r.id,
  name: r.name,
  address: r.address,
  latitude: num(r.latitude),
  longitude: num(r.longitude),
  operatingHours: r.operating_hours,
  contactPhone: r.contact_phone,
  isActive: r.is_active,
});

async function listActive() {
  const { rows } = await query('SELECT * FROM drop_points WHERE is_active ORDER BY name');
  return rows.map(map);
}

async function listAll() {
  const { rows } = await query('SELECT * FROM drop_points ORDER BY is_active DESC, name');
  return rows.map(map);
}

async function create(input) {
  const { rows } = await query(
    `INSERT INTO drop_points (name, address, latitude, longitude, operating_hours, contact_phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.name, input.address, input.latitude ?? null, input.longitude ?? null, input.operatingHours ?? null, input.contactPhone ?? null],
  );
  return map(rows[0]);
}

async function update(id, patch) {
  const { sets, values } = buildSet(patch, COLUMNS);
  values.push(id);
  const { rows } = await query(
    `UPDATE drop_points SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (!rows[0]) throw new AppError(404, 'Titik pengumpulan tidak ditemukan');
  return map(rows[0]);
}

module.exports = { listActive, listAll, create, update };
