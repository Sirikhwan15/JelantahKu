import { vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { api } from '@/services/api';
import { createAppRouter } from '@/router';
import App from '@/App.vue';

// jsdom belum mengimplementasikan scrollTo (dipakai scrollBehavior router)
window.scrollTo = () => {};

export const tick = async (n = 3) => {
  for (let i = 0; i < n; i += 1) {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
  }
};

export const userOf = (role, extra = {}) => ({
  id: 1, name: 'Tester', email: 't@x.com', phone: null, role, wallet: null, umkmProfile: null, ...extra,
});

/** Menyiapkan sesi: token tersimpan + respons /auth/me. */
export function prepare({ token, me, meError, handlers = {} } = {}) {
  localStorage.clear();
  if (token) localStorage.setItem('jelantahku.token', token);
  setActivePinia(createPinia());
  api.get.mockReset();
  api.post.mockReset();
  api.get.mockImplementation(async (path) => {
    if (path === '/auth/me') {
      if (meError) throw meError;
      return { user: me };
    }
    for (const [prefix, fn] of Object.entries(handlers)) if (path.startsWith(prefix)) return fn(path);
    throw new Error(`api.get tidak di-mock: ${path}`);
  });
}

export async function bootRouter(path) {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  return router;
}

/** Memasang aplikasi sungguhan (App + router + pinia) di jsdom dan mencatat peringatan/galat konsol. */
export async function mountAt(path) {
  const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const router = await bootRouter(path);
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(App);
  // pinia aktif dipakai lewat setActivePinia pada prepare()
  const { getActivePinia } = await import('pinia');
  app.use(getActivePinia()).use(router);
  app.mount(root);
  await tick();
  return {
    root,
    router,
    app,
    consoleIssues: () => [...spyWarn.mock.calls, ...spyError.mock.calls].map((c) => c.map(String).join(' ')),
    unmount() { app.unmount(); root.remove(); spyWarn.mockRestore(); spyError.mockRestore(); },
  };
}

export function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
