import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { roleHome } from '@/utils/roles';

const TOKEN_KEY = 'jelantahku.token';

// localStorage bisa tidak tersedia (mode privat ketat); jangan sampai aplikasi crash karenanya.
const storage = {
  read() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  write(value) { try { localStorage.setItem(TOKEN_KEY, value); } catch { /* abaikan */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* abaikan */ } },
};

export const useAuthStore = defineStore('auth', () => {
  const token = ref(storage.read());
  const user = ref(null);
  const initialized = ref(false);
  let initPromise = null;

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const role = computed(() => user.value?.role ?? null);
  const homePath = computed(() => roleHome(role.value));
  const isCustomer = computed(() => role.value === 'household' || role.value === 'umkm');

  function setToken(value) {
    token.value = value;
    storage.write(value);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    storage.clear();
  }

  async function fetchMe() {
    const data = await api.get('/auth/me');
    user.value = data.user;
    return data.user;
  }

  /** Dipanggil router sebelum navigasi pertama: memulihkan sesi dari token yang tersimpan. */
  function init() {
    if (initialized.value) return Promise.resolve();
    if (!initPromise) {
      initPromise = (async () => {
        if (token.value) {
          try {
            await fetchMe();
          } catch (err) {
            if (err.status === 401) clearSession();
            // gagal jaringan: token dipertahankan, pengguna diminta masuk ulang bila perlu
          }
        }
        initialized.value = true;
      })();
    }
    return initPromise;
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password }, { auth: false });
    setToken(data.token);
    await fetchMe();
    return user.value;
  }

  async function register(payload) {
    const data = await api.post('/auth/register', payload, { auth: false });
    setToken(data.token);
    await fetchMe();
    return user.value;
  }

  function logout() {
    clearSession();
  }

  return { token, user, initialized, isAuthenticated, role, homePath, isCustomer, init, login, register, fetchMe, logout, clearSession };
});
