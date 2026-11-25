// Peta role -> beranda dan label tampilan. "customer" = household atau umkm.
export const ROLE_HOME = {
  household: '/customer',
  umkm: '/customer',
  courier: '/courier',
  admin: '/admin',
};

export const ROLE_LABEL = {
  household: 'Rumah Tangga',
  umkm: 'Mitra Kuliner (UMKM)',
  courier: 'Kurir',
  admin: 'Admin',
};

export const roleHome = (role) => ROLE_HOME[role] ?? '/';
export const roleLabel = (role) => ROLE_LABEL[role] ?? role;
