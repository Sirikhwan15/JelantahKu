import { House } from 'lucide-vue-next';

// Menu per role. Tahap berikutnya (5B/5C) menambah item di sini; item hanya boleh menunjuk rute yang SUDAH ada.
export const NAV_ITEMS = {
  customer: [{ to: '/customer', label: 'Beranda', icon: House, exact: true }],
  courier: [{ to: '/courier', label: 'Beranda', icon: House, exact: true }],
  admin: [{ to: '/admin', label: 'Beranda', icon: House, exact: true }],
};

export function navForRole(role) {
  if (role === 'household' || role === 'umkm') return NAV_ITEMS.customer;
  return NAV_ITEMS[role] ?? [];
}
