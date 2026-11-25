<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  tone: { type: String, default: 'brand' }, // brand | accent | neutral
});
const tones = {
  brand: 'bg-brand-100 text-brand-800',
  accent: 'bg-accent-100 text-accent-900',
  neutral: 'bg-line text-ink',
};
</script>

<template>
  <div class="card p-5">
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm font-semibold text-muted">{{ label }}</p>
      <span v-if="icon" class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="tones[tone]">
        <component :is="icon" class="size-5" aria-hidden="true" />
      </span>
    </div>
    <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-sm text-muted">{{ hint }}</p>
  </div>
</template>
