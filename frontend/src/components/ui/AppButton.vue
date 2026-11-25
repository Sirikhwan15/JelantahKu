<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { LoaderCircle } from 'lucide-vue-next';

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' }, // md | lg
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
});

const variants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  secondary: 'bg-card text-brand-800 border border-line-strong hover:bg-brand-50 active:bg-brand-100',
  ghost: 'bg-transparent text-ink hover:bg-brand-50 active:bg-brand-100',
  danger: 'bg-danger-700 text-white hover:bg-danger-700/90',
};

const classes = computed(() => [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-colors duration-150',
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
  props.size === 'lg' ? 'min-h-12 px-6 text-lg' : 'text-base',
  props.block ? 'w-full' : '',
  variants[props.variant] ?? variants.primary,
]);
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <slot />
  </RouterLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <LoaderCircle v-if="loading" class="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <slot />
  </button>
</template>
