import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { roleHome } from '@/utils/roles';

const PublicLayout = () => import('@/layouts/PublicLayout.vue');
const AppLayout = () => import('@/layouts/AppLayout.vue');

const CUSTOMER_ROLES = ['household', 'umkm'];

export const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/landing/LandingView.vue'), meta: { title: 'Ubah minyak jelantah jadi saldo dan poin hijau' } },
      { path: 'masuk', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Masuk', guestOnly: true } },
      { path: 'daftar', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: 'Daftar', guestOnly: true } },
      { path: 'tidak-diizinkan', name: 'forbidden', component: () => import('@/views/system/ForbiddenView.vue'), meta: { title: 'Akses ditolak' } },
    ],
  },
  {
    path: '/customer',
    component: AppLayout,
    meta: { requiresAuth: true, roles: CUSTOMER_ROLES },
    children: [
      { path: '', name: 'customer-home', component: () => import('@/views/customer/CustomerHome.vue'), meta: { title: 'Beranda' } },
    ],
  },
  {
    path: '/courier',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['courier'] },
    children: [
      { path: '', name: 'courier-home', component: () => import('@/views/courier/CourierHome.vue'), meta: { title: 'Beranda Kurir' } },
    ],
  },
  {
    path: '/admin',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '', name: 'admin-home', component: () => import('@/views/admin/AdminHome.vue'), meta: { title: 'Beranda Admin' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: PublicLayout,
    children: [{ path: '', name: 'not-found', component: () => import('@/views/system/NotFoundView.vue'), meta: { title: 'Halaman tidak ditemukan' } }],
  },
];

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved;
      if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
      return { top: 0 };
    },
  });

  router.beforeEach(async (to) => {
    const auth = useAuthStore();
    await auth.init(); // pulihkan sesi dari token tersimpan (sekali)

    const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
    if (requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    const roles = to.matched.map((r) => r.meta.roles).find(Boolean);
    if (roles && !roles.includes(auth.role)) {
      return { name: 'forbidden' };
    }

    if (to.matched.some((r) => r.meta.guestOnly) && auth.isAuthenticated) {
      return roleHome(auth.role);
    }
    return true;
  });

  router.afterEach((to) => {
    const title = to.meta.title;
    document.title = title ? `${title} · JelantahKu` : 'JelantahKu';
  });

  return router;
}
