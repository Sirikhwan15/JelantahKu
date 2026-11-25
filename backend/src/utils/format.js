'use strict';

/** NUMERIC dari pg berupa string; ubah ke angka hanya untuk ditampilkan. */
const num = (v) => (v === null || v === undefined ? null : Number(v));

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const paged = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});

module.exports = { num, round2, paged };
