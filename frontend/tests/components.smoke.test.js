import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => {
  class ApiError extends Error {
    constructor(status, message, details = null) { super(message); this.status = status; this.details = details; }
  }
  return { ApiError, api: { get: vi.fn(), post: vi.fn() }, configureApi: vi.fn(), request: vi.fn() };
});

import { ApiError, api } from '@/services/api';
import { mountAt, prepare, text, tick, type, userOf } from './helpers';

let ctx;
afterEach(() => { ctx?.unmount(); ctx = null; document.body.replaceChildren(); });

const labelsAreLinked = (root) => {
  const inputs = [...root.querySelectorAll('input:not([type=radio])')];
  return inputs.every((i) => i.id && root.querySelector(`label[for="${i.id}"]`));
};

describe('Landing', () => {
  it('menampilkan konten utama, CTA, dan struktur aksesibel tanpa peringatan konsol', async () => {
    prepare({});
    ctx = await mountAt('/');
    expect(text(ctx.root.querySelector('h1'))).toContain('Minyak jelantah Anda bernilai');
    expect(ctx.root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(ctx.root.querySelector('main#main')).not.toBeNull();
    const hrefs = [...ctx.root.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/daftar');
    expect(hrefs).toContain('/masuk');
    ['cara-kerja', 'insentif', 'mitra', 'dampak'].forEach((id) => expect(ctx.root.querySelector(`#${id}`)).not.toBeNull());
    expect(text(ctx.root)).toContain('estimasi'); // klaim dampak diberi label estimasi
    expect(ctx.consoleIssues()).toEqual([]);
  });

  it('pengguna login melihat tombol ke dashboard, bukan Daftar', async () => {
    prepare({ token: 't', me: userOf('courier') });
    ctx = await mountAt('/');
    const hrefs = [...ctx.root.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/courier');
    expect(hrefs).not.toContain('/daftar');
  });

  it('menu seluler membuka dan menutup dengan aria-expanded', async () => {
    prepare({});
    ctx = await mountAt('/');
    const btn = ctx.root.querySelector('button[aria-controls="mobile-menu"]');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click(); await tick();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(ctx.root.querySelector('#mobile-menu')).not.toBeNull();
  });
});

describe('Login', () => {
  it('label terhubung ke input; submit kosong menampilkan galat di dekat field', async () => {
    prepare({});
    ctx = await mountAt('/masuk');
    expect(labelsAreLinked(ctx.root)).toBe(true);
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick();
    expect(text(ctx.root)).toContain('Email wajib diisi');
    expect(text(ctx.root)).toContain('Password wajib diisi');
    expect(ctx.root.querySelector('input[type=email]').getAttribute('aria-invalid')).toBe('true');
    expect(api.post).not.toHaveBeenCalled();
    expect(ctx.consoleIssues()).toEqual([]);
  });

  it('login sukses mengarahkan ke beranda role dan mengirim email huruf kecil', async () => {
    prepare({ me: userOf('household', { wallet: { cashBalance: 0, pointsBalance: 0 } }), handlers: { '/impact': async () => ({ impact: { totalLiters: 0, completedDeposits: 0, estimatedWaterProtectedLiters: 0, estimatedCo2AvoidedKg: 0, assumptions: { waterLitersPerLiterOil: 1000, co2KgPerLiter: 2 }, badge: null } }) } });
    api.post.mockResolvedValue({ token: 'tok', user: userOf('household') });
    ctx = await mountAt('/masuk');
    type(ctx.root.querySelector('input[type=email]'), '  Budi@Jelantahku.test ');
    type(ctx.root.querySelector('input[type=password]'), 'Password123!');
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(ctx.router.currentRoute.value.path).toBe('/customer'), { timeout: 4000 });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'budi@jelantahku.test', password: 'Password123!' }, { auth: false });
    expect(localStorage.getItem('jelantahku.token')).toBe('tok');
  });

  it('kredensial salah menampilkan pesan server, tombol kembali aktif', async () => {
    prepare({});
    api.post.mockRejectedValue(new ApiError(401, 'Email atau password salah'));
    ctx = await mountAt('/masuk');
    type(ctx.root.querySelector('input[type=email]'), 'a@b.co');
    type(ctx.root.querySelector('input[type=password]'), 'x');
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick(4);
    expect(ctx.root.querySelector('[role=alert]').textContent).toContain('Email atau password salah');
    expect(ctx.root.querySelector('button[type=submit]').disabled).toBe(false);
    expect(ctx.router.currentRoute.value.name).toBe('login');
  });

  it('parameter reason=expired menampilkan info sesi berakhir', async () => {
    prepare({});
    ctx = await mountAt('/masuk?reason=expired');
    expect(text(ctx.root)).toContain('Sesi Anda berakhir');
  });

  it('tombol tampilkan password punya label dan mengubah tipe input', async () => {
    prepare({});
    ctx = await mountAt('/masuk');
    const toggle = ctx.root.querySelector('button[aria-label="Tampilkan password"]');
    expect(toggle).not.toBeNull();
    toggle.click(); await tick();
    expect(ctx.root.querySelector('input#' + ctx.root.querySelector('label[for]:not([for=""])').getAttribute('for'))).not.toBeNull();
    expect(ctx.root.querySelector('button[aria-label="Sembunyikan password"]')).not.toBeNull();
  });
});

describe('Register', () => {
  it('mode UMKM menampilkan field usaha; validasi sisi klien mencegah pengiriman', async () => {
    prepare({});
    ctx = await mountAt('/daftar');
    expect(text(ctx.root)).not.toContain('Nama usaha');
    const radio = ctx.root.querySelector('input[type=radio][value=umkm]');
    radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); await tick();
    expect(text(ctx.root)).toContain('Nama usaha');
    expect(labelsAreLinked(ctx.root)).toBe(true);
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick();
    ['Nama minimal 2 karakter', 'Format email tidak valid', 'Password minimal 8 karakter', 'Nama usaha wajib diisi'].forEach((m) => expect(text(ctx.root)).toContain(m));
    expect(api.post).not.toHaveBeenCalled();
    expect(ctx.consoleIssues()).toEqual([]);
  });

  it('mengirim payload UMKM tanpa field opsional kosong lalu masuk ke dashboard', async () => {
    prepare({ me: userOf('umkm'), handlers: { '/impact': async () => ({ impact: { totalLiters: 20, completedDeposits: 1, estimatedWaterProtectedLiters: 20000, estimatedCo2AvoidedKg: 40, assumptions: { waterLitersPerLiterOil: 1000, co2KgPerLiter: 2 }, badge: { verified: false, requiredLiters: 50, progressLiters: 20, remainingLiters: 30, publicProfileSlug: null } } }) } });
    api.post.mockResolvedValue({ token: 'tok2', user: userOf('umkm') });
    ctx = await mountAt('/daftar');
    const radio = ctx.root.querySelector('input[type=radio][value=umkm]');
    radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); await tick();
    const byLabel = (label) => ctx.root.querySelector(`#${[...ctx.root.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(label)).getAttribute('for')}`);
    type(byLabel('Nama lengkap'), 'Pak Joko');
    type(byLabel('Email'), 'JOKO@mail.com');
    type(byLabel('Password'), 'rahasia123');
    type(byLabel('Nama usaha'), 'Warung Joko');
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(ctx.router.currentRoute.value.path).toBe('/customer'), { timeout: 4000 });
    expect(api.post).toHaveBeenCalledWith('/auth/register', { accountType: 'umkm', name: 'Pak Joko', email: 'joko@mail.com', password: 'rahasia123', businessName: 'Warung Joko' }, { auth: false });
    await vi.waitFor(() => expect(ctx.root.querySelector('[role=progressbar]')).not.toBeNull(), { timeout: 4000 });
    expect(ctx.root.querySelector('[role=progressbar]').getAttribute('aria-valuenow')).toBe('40');
  });

  it('galat validasi server dipetakan ke field yang tepat', async () => {
    prepare({});
    api.post.mockRejectedValue(new ApiError(409, 'Email sudah terdaftar'));
    ctx = await mountAt('/daftar');
    const byLabel = (label) => ctx.root.querySelector(`#${[...ctx.root.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(label)).getAttribute('for')}`);
    type(byLabel('Nama lengkap'), 'Sari');
    type(byLabel('Email'), 'sari@mail.com');
    type(byLabel('Password'), 'rahasia123');
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick(4);
    expect(ctx.root.querySelector('[role=alert]').textContent).toContain('Email sudah terdaftar');

    api.post.mockRejectedValue(new ApiError(400, 'Data yang dikirim tidak valid', [{ field: 'email', message: 'Format email tidak valid' }]));
    ctx.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick(4);
    expect(text(ctx.root)).toContain('Periksa kembali isian yang ditandai.');
    expect(byLabel('Email').getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Dashboard', () => {
  it('customer: saldo, poin, dan dampak berlabel estimasi', async () => {
    prepare({
      token: 't',
      me: userOf('household', { name: 'Budi', wallet: { cashBalance: 30000, pointsBalance: 50 } }),
      handlers: { '/impact': async () => ({ impact: { totalLiters: 5, completedDeposits: 1, rejectedDeposits: 0, estimatedWaterProtectedLiters: 5000, estimatedCo2AvoidedKg: 10, assumptions: { isEstimate: true, waterLitersPerLiterOil: 1000, co2KgPerLiter: 2 }, badge: null } }) },
    });
    ctx = await mountAt('/customer');
    const t = text(ctx.root).replace(/\s/g, ' ');
    expect(t).toContain('Halo, Budi');
    expect(t).toContain('Rp 30.000');
    expect(t).toContain('50 poin');
    expect(t).toContain('5 L');
    expect(t).toContain('Estimasi air terlindungi');
    expect(t).toContain('estimasi');
    expect(ctx.root.querySelector('[aria-label="Green Merchant Badge"], #badge')).toBeNull(); // household tanpa badge
    expect(ctx.consoleIssues()).toEqual([]);
  });

  it('customer: gagal memuat dampak -> pesan + tombol coba lagi yang berfungsi', async () => {
    let fail = true;
    prepare({ token: 't', me: userOf('household', { wallet: { cashBalance: 0, pointsBalance: 0 } }), handlers: { '/impact': async () => { if (fail) throw new ApiError(0, 'Tidak dapat terhubung ke server.'); return { impact: { totalLiters: 0, completedDeposits: 0, estimatedWaterProtectedLiters: 0, estimatedCo2AvoidedKg: 0, assumptions: { waterLitersPerLiterOil: 1000, co2KgPerLiter: 2 }, badge: null } }; } } });
    ctx = await mountAt('/customer');
    expect(ctx.root.querySelector('[role=alert]').textContent).toContain('Tidak dapat terhubung');
    fail = false;
    [...ctx.root.querySelectorAll('button')].find((b) => b.textContent.includes('Coba lagi')).click();
    await tick(4);
    expect(ctx.root.querySelector('[role=alert]')).toBeNull();
    expect(text(ctx.root)).toContain('Total jelantah disetor');
  });

  it('admin memakai label "Total Jelantah Terkumpul" dan "Estimasi Margin Kotor"', async () => {
    prepare({
      token: 't', me: userOf('admin', { name: 'Admin' }),
      handlers: { '/admin/analytics/summary': async () => ({ collected: { totalLiters: 45.9 }, payouts: { cashPaid: 276509.99 }, marginSimulation: { estimatedMargin: 90690.01 } }) },
    });
    ctx = await mountAt('/admin');
    const t = text(ctx.root).replace(/\s/g, ' ');
    expect(t).toContain('Total Jelantah Terkumpul');
    expect(t).toContain('45,9 L');
    expect(t).toContain('Estimasi Margin Kotor');
    expect(t).toContain('Rp 90.690,01');
    expect(ctx.consoleIssues()).toEqual([]);
  });

  it('kurir melihat jumlah tugas dari paginasi API', async () => {
    prepare({
      token: 't', me: userOf('courier', { name: 'Kurir' }),
      handlers: { '/courier/tasks?status=pending': async () => ({ pagination: { total: 7 } }), '/courier/tasks?status=scheduled': async () => ({ pagination: { total: 2 } }) },
    });
    ctx = await mountAt('/courier');
    expect(text(ctx.root)).toContain('Tugas menunggu diambil7');
    expect(text(ctx.root)).toContain('Tugas saya (terjadwal)2');
  });

  it('layout aplikasi: navigasi aktif memakai aria-current, keluar menghapus sesi', async () => {
    prepare({ token: 't', me: userOf('courier'), handlers: { '/courier/tasks': async () => ({ pagination: { total: 0 } }) } });
    ctx = await mountAt('/courier');
    const current = ctx.root.querySelector('aside nav a[aria-current="page"]');
    expect(current?.textContent).toContain('Beranda');
    [...ctx.root.querySelectorAll('aside button')].find((b) => b.textContent.includes('Keluar')).click();
    await vi.waitFor(() => expect(ctx.router.currentRoute.value.path).toBe('/'), { timeout: 4000 });
    expect(localStorage.getItem('jelantahku.token')).toBeNull();
  });
});

describe('Halaman sistem', () => {
  it('403 untuk role yang salah dan 404 untuk rute asing', async () => {
    prepare({ token: 't', me: userOf('household') });
    ctx = await mountAt('/admin');
    expect(text(ctx.root)).toContain('Anda tidak punya akses');
    ctx.unmount();
    prepare({});
    ctx = await mountAt('/entah-apa');
    expect(text(ctx.root)).toContain('Halaman tidak ditemukan');
  });
});
