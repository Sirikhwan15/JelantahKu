<script setup>
import { ShieldCheck } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <section class="container-page flex flex-col items-center py-20 text-center">
    <span class="flex size-16 items-center justify-center rounded-2xl bg-accent-100 text-accent-900"><ShieldCheck class="size-8" aria-hidden="true" /></span>
    <h1 class="mt-6 text-3xl font-extrabold">Anda tidak punya akses ke halaman ini</h1>
    <p class="mt-2 max-w-md text-muted">Halaman ini khusus untuk peran lain. Jika menurut Anda ini keliru, hubungi admin.</p>
    <AppButton :to="auth.isAuthenticated ? auth.homePath : '/masuk'" class="mt-6">
      {{ auth.isAuthenticated ? 'Kembali ke dashboard saya' : 'Masuk' }}
    </AppButton>
  </section>
</template>
