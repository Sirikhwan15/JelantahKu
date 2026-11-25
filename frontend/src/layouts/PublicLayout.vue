<script setup>
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Menu, X } from 'lucide-vue-next';
import BrandLogo from '@/components/shared/BrandLogo.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const open = ref(false);
const onLanding = computed(() => route.name === 'home');

const links = [
  { href: '/#cara-kerja', label: 'Cara kerja' },
  { href: '/#insentif', label: 'Insentif' },
  { href: '/#mitra', label: 'Untuk UMKM' },
  { href: '/#dampak', label: 'Dampak' },
];
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main" class="skip-link">Lewati ke konten utama</a>

    <header class="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between">
        <RouterLink to="/" aria-label="JelantahKu, ke beranda" class="rounded-lg"><BrandLogo /></RouterLink>

        <nav v-if="onLanding" aria-label="Navigasi utama" class="hidden items-center gap-1 lg:flex">
          <a v-for="l in links" :key="l.href" :href="l.href" class="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:text-ink">{{ l.label }}</a>
        </nav>

        <div class="hidden items-center gap-2 sm:flex">
          <AppButton v-if="auth.isAuthenticated" :to="auth.homePath">Buka dashboard</AppButton>
          <template v-else>
            <AppButton to="/masuk" variant="ghost">Masuk</AppButton>
            <AppButton to="/daftar">Daftar gratis</AppButton>
          </template>
        </div>

        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-brand-50 sm:hidden"
          :aria-expanded="open"
          aria-controls="mobile-menu"
          :aria-label="open ? 'Tutup menu' : 'Buka menu'"
          @click="open = !open"
        >
          <X v-if="open" class="size-6" aria-hidden="true" />
          <Menu v-else class="size-6" aria-hidden="true" />
        </button>
      </div>

      <div v-if="open" id="mobile-menu" class="border-t border-line bg-surface sm:hidden">
        <nav class="container-page flex flex-col gap-1 py-3" aria-label="Menu seluler">
          <template v-if="onLanding">
            <a v-for="l in links" :key="l.href" :href="l.href" class="flex min-h-11 items-center rounded-lg px-3 font-semibold" @click="open = false">{{ l.label }}</a>
          </template>
          <div class="mt-2 flex flex-col gap-2">
            <AppButton v-if="auth.isAuthenticated" :to="auth.homePath" block @click="open = false">Buka dashboard</AppButton>
            <template v-else>
              <AppButton to="/daftar" block @click="open = false">Daftar gratis</AppButton>
              <AppButton to="/masuk" variant="secondary" block @click="open = false">Masuk</AppButton>
            </template>
          </div>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1" class="flex-1 focus:outline-none">
      <RouterView />
    </main>

    <footer class="border-t border-line bg-card">
      <div class="container-page flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo />
        <p>Platform pengumpulan minyak jelantah berbasis ekonomi sirkular.</p>
      </div>
    </footer>
  </div>
</template>
