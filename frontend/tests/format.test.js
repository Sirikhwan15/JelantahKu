import { describe, expect, it } from 'vitest';
import { formatDateTime, formatKg, formatLiters, formatNumber, formatPoints, formatRupiah } from '@/utils/format';

const plain = (s) => s.replace(/\s/g, ' '); // Intl memakai spasi tak-terputus

describe('format', () => {
  it('Rupiah bulat tanpa sen', () => {
    expect(plain(formatRupiah(30000))).toBe('Rp 30.000');
    expect(plain(formatRupiah(0))).toBe('Rp 0');
  });
  it('Rupiah menampilkan sen hanya bila ada (agar tidak menyesatkan)', () => {
    expect(plain(formatRupiah(21089.99))).toBe('Rp 21.089,99');
  });
  it('nilai tidak valid dianggap 0', () => {
    expect(plain(formatRupiah(undefined))).toBe('Rp 0');
    expect(plain(formatRupiah('abc'))).toBe('Rp 0');
  });
  it('liter, kg, poin memakai pemisah Indonesia', () => {
    expect(formatLiters(12.5)).toBe('12,5 L');
    expect(formatKg(1234.5)).toBe('1.234,5 kg');
    expect(formatPoints(1250)).toBe('1.250 poin');
    expect(formatNumber(1000)).toBe('1.000');
  });
  it('tanggal memakai zona Asia/Jakarta dan menangani nilai kosong', () => {
    expect(formatDateTime('2026-11-24T17:00:00Z')).toContain('25'); // 00.00 WIB hari berikutnya
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('bukan tanggal')).toBe('-');
  });
});
