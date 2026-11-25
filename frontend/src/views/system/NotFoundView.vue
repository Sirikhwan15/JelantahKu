<script setup>
import { CloudOff } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
</script>

<template>
  <section class="container-page flex flex-col items-center py-20 text-center">
    <span class="flex size-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-800"><CloudOff class="size-8" aria-hidden="true" /></span>
    <h1 class="mt-6 text-3xl font-extrabold">Halaman tidak ditemukan</h1>
    <p class="mt-2 max-w-md text-muted">Tautan yang Anda buka tidak ada atau sudah dipindahkan.</p>
    <AppButton to="/" class="mt-6">Kembali ke beranda</AppButton>
  </section>
</template>
