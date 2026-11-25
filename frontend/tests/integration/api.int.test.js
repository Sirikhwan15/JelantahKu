// Uji kontrak frontend <-> backend NYATA. Dilewati kecuali API_INTEGRATION=1.
// Jalankan: API_INTEGRATION=1 VITE_API_BASE_URL=http://localhost:5000/api npx vitest run tests/integration
// Memerlukan backend hidup dengan database yang baru di-seed. Hanya membaca data (tidak mengubah apa pun).
import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ApiError, api, configureApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const run = process.env.API_INTEGRATION === '1';

describe.skipIf(!run)('integrasi API nyata', () => {
  const setup = () => {
    localStorage.clear();
    setActivePinia(createPinia());
    const auth = useAuthStore();
    const onUnauthorized = vi.fn();
    configureApi({ getToken: () => auth.token, onUnauthorized });
    return { auth, onUnauthorized };
  };

  it('login customer lewat store: user, peran, dan dompet terisi', async () => {
    const { auth } = setup();
    const user = await auth.login('budi@jelantahku.test', 'Password123!');
    expect(user.role).toBe('household');
    expect(auth.isAuthenticated).toBe(true);
    expect(typeof user.wallet.cashBalance).toBe('number');
    expect(Number.isInteger(user.id)).toBe(true);
  });

  it('GET /impact sesuai bentuk yang dipakai dashboard', async () => {
    const { auth } = setup();
    await auth.login('budi@jelantahku.test', 'Password123!');
    const { impact } = await api.get('/impact');
    for (const k of ['totalLiters', 'estimatedWaterProtectedLiters', 'estimatedCo2AvoidedKg', 'completedDeposits']) expect(typeof impact[k]).toBe('number');
    expect(impact.assumptions.isEstimate).toBe(true);
  });

  it('admin: ringkasan memuat marginSimulation berlabel simulasi', async () => {
    const { auth } = setup();
    await auth.login('admin@jelantahku.test', 'Password123!');
    const s = await api.get('/admin/analytics/summary');
    expect(s.marginSimulation.isSimulation).toBe(true);
    expect(typeof s.collected.totalLiters).toBe('number');
  });

  it('kurir: paginasi tugas', async () => {
    const { auth } = setup();
    await auth.login('kurir1@jelantahku.test', 'Password123!');
    const p = await api.get('/courier/tasks?status=pending&limit=1');
    expect(typeof p.pagination.total).toBe('number');
  });

  it('kredensial salah -> ApiError 401; token palsu memicu onUnauthorized', async () => {
    const { auth, onUnauthorized } = setup();
    await expect(auth.login('budi@jelantahku.test', 'salah')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).not.toHaveBeenCalled(); // login memang tanpa token
    auth.token = 'token.palsu.sekali';
    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('galat validasi register membawa details per field', async () => {
    setup();
    const err = await api.post('/auth/register', { accountType: 'household', name: 'A', email: 'bukan-email', password: '123' }, { auth: false }).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.details.map((d) => d.field)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});
