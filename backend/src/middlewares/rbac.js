'use strict';
const AppError = require('../utils/AppError');

// "customer" adalah kelompok peran: household + umkm
const ROLE_GROUPS = { customer: ['household', 'umkm'] };

/** Pakai SETELAH authenticate. Contoh: router.get('/x', authenticate, authorize('admin')) */
const authorize = (...allowed) => {
  const roles = new Set(allowed.flatMap((r) => ROLE_GROUPS[r] || [r]));
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Autentikasi diperlukan'));
    if (!roles.has(req.user.role)) {
      return next(new AppError(403, 'Anda tidak memiliki akses ke sumber daya ini'));
    }
    return next();
  };
};

module.exports = { authorize };
