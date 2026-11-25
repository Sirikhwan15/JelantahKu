/**
 * Menentukan tujuan setelah login. Parameter ?redirect hanya dipakai bila berupa jalur INTERNAL
 * (mencegah open redirect seperti //situs-jahat.com) dan boleh diakses role pengguna.
 */
export function resolveRedirect(router, redirect, role, fallback) {
  if (typeof redirect !== 'string') return fallback;
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('\\')) return fallback;
  const resolved = router.resolve(redirect);
  if (!resolved.matched.length) return fallback;
  const roles = resolved.matched.map((r) => r.meta.roles).find(Boolean);
  if (roles && !roles.includes(role)) return fallback;
  if (resolved.matched.some((r) => r.meta.guestOnly)) return fallback;
  return resolved.fullPath;
}
