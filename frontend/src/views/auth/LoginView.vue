<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useFormErrors } from '@/composables/useFormErrors';
import { useAuthStore } from '@/stores/auth';
import { resolveRedirect } from '@/utils/redirect';
import { roleHome } from '@/utils/roles';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const errors = useFormErrors();

const email = ref('');
const password = ref('');
const loading = ref(false);
const isDev = import.meta.env.DEV;

function validate() {
  errors.clear();
  if (!email.value.trim()) errors.set('email', 'Email wajib diisi');
  else if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) errors.set('email', 'Format email tidak valid');
  if (!password.value) errors.set('password', 'Password wajib diisi');
  return !errors.hasErrors();
}

async function submit() {
  if (!validate()) return;
  loading.value = true;
  try {
    const user = await auth.login(email.value.trim().toLowerCase(), password.value);
    const target = resolveRedirect(router, route.query.redirect, user.role, roleHome(user.role));
    await router.replace(target);
  } catch (err) {
    errors.fromApiError(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container-page flex justify-center py-10 sm:py-16">
    <div class="w-full max-w-md">
      <h1 class="text-3xl font-extrabold">Masuk ke JelantahKu</h1>
      <p class="mt-2 text-muted">Belum punya akun? <RouterLink to="/daftar" class="font-semibold text-brand-800 underline underline-offset-4">Daftar gratis</RouterLink></p>

      <div class="card mt-6 p-6">
        <AppAlert v-if="route.query.reason === 'expired'" tone="info" class="mb-4">Sesi Anda berakhir. Silakan masuk lagi.</AppAlert>
        <AppAlert v-if="errors.general.value" tone="error" class="mb-4">{{ errors.general.value }}</AppAlert>

        <form class="space-y-4" novalidate @submit.prevent="submit">
          <AppInput v-model="email" label="Email" type="email" autocomplete="email" inputmode="email" :error="errors.fields.email" @update:model-value="errors.clear('email')" />
          <AppInput v-model="password" label="Password" type="password" autocomplete="current-password" :error="errors.fields.password" @update:model-value="errors.clear('password')" />
          <AppButton type="submit" block size="lg" :loading="loading">Masuk</AppButton>
        </form>
      </div>

      <details v-if="isDev" class="mt-4 rounded-xl border border-line bg-card p-4 text-sm">
        <summary class="font-semibold">Akun uji (hanya tampil saat development)</summary>
        <ul class="mt-2 space-y-1 text-muted">
          <li>Rumah tangga: budi@jelantahku.test</li>
          <li>UMKM: warung@jelantahku.test</li>
          <li>Kurir: kurir1@jelantahku.test</li>
          <li>Admin: admin@jelantahku.test</li>
          <li>Password semuanya: Password123!</li>
        </ul>
      </details>
    </div>
  </section>
</template>
