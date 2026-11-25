<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { LogOut } from 'lucide-vue-next';
import BrandLogo from '@/components/shared/BrandLogo.vue';
import { useAuthStore } from '@/stores/auth';
import { navForRole } from '@/utils/navigation';
import { roleLabel } from '@/utils/roles';

const auth = useAuthStore();
const router = useRouter();
const items = computed(() => navForRole(auth.role));

function logout() {
  auth.logout();
  router.replace('/');
}

const linkClass = 'flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-ink';
</script>

<template>
  <div class="min-h-screen lg:flex">
    <a href="#main" class="skip-link">Lewati ke konten utama</a>

    <!-- Sidebar desktop -->
    <aside class="hidden w-64 shrink-0 flex-col border-r border-line bg-card lg:flex">
      <div class="flex h-16 items-center px-5">
        <RouterLink to="/" aria-label="JelantahKu, ke beranda" class="rounded-lg"><BrandLogo /></RouterLink>
      </div>
      <nav aria-label="Navigasi aplikasi" class="flex-1 space-y-1 px-3 py-2">
        <RouterLink v-for="item in items" :key="item.to" :to="item.to" :exact-active-class="item.exact ? 'bg-brand-100 !text-brand-900' : ''" :active-class="item.exact ? '' : 'bg-brand-100 !text-brand-900'" :class="linkClass">
          <component :is="item.icon" class="size-5" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-line p-4">
        <p class="truncate font-semibold">{{ auth.user?.name }}</p>
        <p class="mb-3 text-sm text-muted">{{ roleLabel(auth.role) }}</p>
        <button type="button" class="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 font-semibold text-muted hover:bg-brand-50 hover:text-ink" @click="logout">
          <LogOut class="size-5" aria-hidden="true" />
          Keluar
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">
      <!-- Bar atas seluler -->
      <header class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <RouterLink to="/" aria-label="JelantahKu, ke beranda" class="rounded-lg"><BrandLogo /></RouterLink>
        <button type="button" class="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-brand-50" aria-label="Keluar dari akun" @click="logout">
          <LogOut class="size-5" aria-hidden="true" />
        </button>
      </header>

      <main id="main" tabindex="-1" class="flex-1 px-4 py-6 pb-24 focus:outline-none sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
        <div class="mx-auto w-full max-w-5xl">
          <RouterView />
        </div>
      </main>

      <!-- Navigasi bawah seluler (maks. 5 item) -->
      <nav v-if="items.length > 1" aria-label="Navigasi aplikasi" class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul class="mx-auto flex max-w-xl">
          <li v-for="item in items.slice(0, 5)" :key="item.to" class="flex-1">
            <RouterLink :to="item.to" class="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold text-muted" :exact-active-class="item.exact ? '!text-brand-800' : ''" :active-class="item.exact ? '' : '!text-brand-800'">
              <component :is="item.icon" class="size-5" aria-hidden="true" />
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
