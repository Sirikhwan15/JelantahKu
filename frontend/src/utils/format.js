const rupiahWhole = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const rupiahCents = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
const dateOnly = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });

/** Rp1.250 atau Rp1.250,50 (sen hanya ditampilkan bila ada, agar tidak menyesatkan). */
export function formatRupiah(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? rupiahWhole.format(n) : rupiahCents.format(n);
}

export const formatNumber = (value) => decimal.format(Number(value) || 0);
export const formatLiters = (value) => `${decimal.format(Number(value) || 0)} L`;
export const formatKg = (value) => `${decimal.format(Number(value) || 0)} kg`;
export const formatPoints = (value) => `${new Intl.NumberFormat('id-ID').format(Number(value) || 0)} poin`;

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : dateTime.format(d);
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : dateOnly.format(d);
}
