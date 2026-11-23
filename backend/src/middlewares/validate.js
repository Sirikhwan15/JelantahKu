'use strict';
const AppError = require('../utils/AppError');

/**
 * Validasi req[source] dengan skema zod. Field yang tidak ada di skema DIBUANG
 * (mencegah mass-assignment, mis. klien menyelipkan "role": "admin").
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(new AppError(400, 'Data yang dikirim tidak valid', details));
  }
  req[source] = result.data;
  return next();
};

module.exports = validate;
