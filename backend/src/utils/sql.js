'use strict';

/**
 * Menyusun potongan "kolom = $n" untuk UPDATE parsial.
 * Nama kolom HANYA berasal dari columnMap (konstanta di kode), nilai selalu lewat parameter.
 */
function buildSet(patch, columnMap, startIndex = 1) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${column} = $${startIndex + values.length - 1}`);
    }
  }
  return { sets, values };
}

module.exports = { buildSet };
