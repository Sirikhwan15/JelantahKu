<script setup>
import { computed, ref, useId } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  optional: { type: Boolean, default: false },
  autocomplete: { type: String, default: undefined },
  inputmode: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  maxlength: { type: [Number, String], default: undefined },
});
const emit = defineEmits(['update:modelValue']);

const id = useId();
const hintId = `${id}-hint`;
const errorId = `${id}-error`;
const reveal = ref(false);

const isPassword = computed(() => props.type === 'password');
const inputType = computed(() => (isPassword.value && reveal.value ? 'text' : props.type));
const describedBy = computed(() => [props.error ? errorId : null, props.hint ? hintId : null].filter(Boolean).join(' ') || undefined);
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-semibold text-ink">
      {{ label }}
      <span v-if="optional" class="font-normal text-muted">(opsional)</span>
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="inputType"
        :value="modelValue"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="min-h-11 w-full rounded-xl border bg-card px-4 text-base text-ink placeholder:text-muted/85 transition-colors duration-150 hover:border-ink focus:border-brand-700"
        :class="[error ? 'border-danger-700' : 'border-field', isPassword ? 'pr-12' : '']"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted hover:text-ink"
        :aria-label="reveal ? 'Sembunyikan password' : 'Tampilkan password'"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      >
        <EyeOff v-if="reveal" class="size-5" aria-hidden="true" />
        <Eye v-else class="size-5" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hint" :id="hintId" class="mt-1.5 text-sm text-muted">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="mt-1.5 text-sm font-medium text-danger-700" aria-live="polite">{{ error }}</p>
  </div>
</template>
