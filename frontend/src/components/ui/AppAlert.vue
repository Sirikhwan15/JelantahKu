<script setup>
import { computed } from 'vue';
import { CircleCheck, Info, TriangleAlert, CircleX } from 'lucide-vue-next';

const props = defineProps({
  tone: { type: String, default: 'info' }, // info | success | warning | error
  title: { type: String, default: '' },
});

const config = computed(() => ({
  info: { icon: Info, box: 'border-info-700/30 bg-info-50 text-info-700', role: 'status' },
  success: { icon: CircleCheck, box: 'border-success-700/30 bg-success-50 text-success-700', role: 'status' },
  warning: { icon: TriangleAlert, box: 'border-warning-700/30 bg-warning-50 text-warning-700', role: 'status' },
  error: { icon: CircleX, box: 'border-danger-700/30 bg-danger-50 text-danger-700', role: 'alert' },
}[props.tone] ?? { icon: Info, box: '', role: 'status' }));
</script>

<template>
  <div :role="config.role" class="flex gap-3 rounded-xl border p-4 text-sm" :class="config.box">
    <component :is="config.icon" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <div class="text-ink">
      <p v-if="title" class="font-semibold">{{ title }}</p>
      <div><slot /></div>
    </div>
  </div>
</template>
