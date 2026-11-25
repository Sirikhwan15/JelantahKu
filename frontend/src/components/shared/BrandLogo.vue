<script setup>
defineProps({ showText: { type: Boolean, default: true } });
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" class="fill-brand-700" />
      <path d="M16 5c3.6 5.4 8 9.2 8 14a8 8 0 1 1-16 0c0-4.8 4.4-8.6 8-14Z" fill="#fff" />
      <path d="M12.5 20.5c1 2 2.8 3 5 3" class="stroke-brand-700" stroke-width="2" stroke-linecap="round" fill="none" />
    </svg>
    <span v-if="showText" class="text-xl font-extrabold tracking-tight text-ink">Jelantah<span class="text-brand-700">Ku</span></span>
    <span v-else class="sr-only">JelantahKu</span>
  </span>
</template>
