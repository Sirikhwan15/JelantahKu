import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => {
  class ApiError extends Error {
    constructor(status, message, details = null) { super(message); this.status = status; this.details = details; }
  }
  return { ApiError, api: { get: vi.fn(), post: vi.fn() }, configureApi: vi.fn(), request: vi.fn() };
});

import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { resolveRedirect } from '@/utils/redirect';
import { bootRouter, prepare, userOf } from './helpers';

const at = async (path, session) => {
  prepare(session);
  const router = await bootRouter(path);
  return { router, name: router.currentRoute.value.name, route: router.currentRoute.value };
};

describe('guard navigasi', () => {
  beforeEach(() => document.body.replaceChildren());

  it('tamu ke area customer -> login dengan parameter redirect', async () => {
    const { name, route } = await at('/customer', {});
    expect(name).toBe('login');
    expect(route.query.redirect).toBe('/customer');
  });

  it('tamu ke area admin dan kurir -> login', async () => {
    expect((await at('/admin', {})).name).toBe('login');
    expect((await at('/courier', {})).name).toBe('login');
  });

  it('household tidak boleh ke admin maupun kurir', async () => {
    const s = { token: 't', me: userOf('household') };
    expect((await at('/admin', s)).name).toBe('forbidden');
    expect((await at('/courier', s)).name).toBe('forbidden');
  });

  it('kurir tidak boleh ke area customer; admin tidak boleh ke area kurir', async () => {
    expect((await at('/customer', { token: 't', me: userOf('courier') })).name).toBe('forbidden');
    expect((await at('/courier', { token: 't', me: userOf('admin') })).name).toBe('forbidden');
  });

  it('role yang tepat boleh masuk (household, umkm, kurir, admin)', async () => {
    expect((await at('/customer', { token: 't', me: userOf('household') })).name).toBe('customer-home');
    expect((await at('/customer', { token: 't', me: userOf('umkm') })).name).toBe('customer-home');
    expect((await at('/courier', { token: 't', me: userOf('courier') })).name).toBe('courier-home');
    expect((await at('/admin', { token: 't', me: userOf('admin') })).name).toBe('admin-home');
  });

  it('pengguna yang sudah login dialihkan dari /masuk dan /daftar ke beranda perannya', async () => {
    const c = { token: 't', me: userOf('courier') };
    expect((await at('/masuk', c)).route.path).toBe('/courier');
    expect((await at('/daftar', { token: 't', me: userOf('umkm') })).route.path).toBe('/customer');
  });

  it('token kedaluwarsa (401 di /auth/me) -> sesi dibersihkan dan diminta masuk', async () => {
    const { name } = await at('/customer', { token: 'basi', meError: new ApiError(401, 'Token tidak valid') });
    expect(name).toBe('login');
    expect(localStorage.getItem('jelantahku.token')).toBeNull();
  });

  it('server tidak terjangkau saat startup -> tidak menghapus token, tetap diminta masuk', async () => {
    const { name } = await at('/customer', { token: 'masih-valid', meError: new ApiError(0, 'Tidak dapat terhubung') });
    expect(name).toBe('login');
    expect(localStorage.getItem('jelantahku.token')).toBe('masih-valid');
  });

  it('halaman publik terbuka untuk tamu, rute asing -> not-found, judul tab diatur', async () => {
    expect((await at('/', {})).name).toBe('home');
    expect((await at('/daftar', {})).name).toBe('register');
    expect((await at('/tidak-ada-halaman', {})).name).toBe('not-found');
    await at('/masuk', {});
    expect(document.title).toBe('Masuk · JelantahKu');
  });

  it('sesi dipulihkan sekali saja meski banyak navigasi', async () => {
    prepare({ token: 't', me: userOf('household') });
    const router = await bootRouter('/customer');
    await router.push('/');
    await router.push('/customer');
    const { api } = await import('@/services/api');
    expect(api.get.mock.calls.filter((c) => c[0] === '/auth/me')).toHaveLength(1);
    expect(useAuthStore().isAuthenticated).toBe(true);
  });
});

describe('resolveRedirect (anti open-redirect)', () => {
  it('hanya menerima jalur internal yang boleh diakses role', async () => {
    prepare({});
    const router = await bootRouter('/');
    const fb = '/fallback';
    expect(resolveRedirect(router, '/customer', 'household', fb)).toBe('/customer');
    expect(resolveRedirect(router, '//situs-jahat.com', 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, 'https://situs-jahat.com', 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, '/\\situs-jahat.com', 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, '/admin', 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, '/masuk', 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, undefined, 'household', fb)).toBe(fb);
    expect(resolveRedirect(router, ['/customer'], 'household', fb)).toBe(fb);
  });
});
