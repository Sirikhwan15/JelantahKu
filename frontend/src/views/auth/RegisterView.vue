<script setup>
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { House, Store } from 'lucide-vue-next';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useFormErrors } from '@/composables/useFormErrors';
import { useAuthStore } from '@/stores/auth';
import { roleHome } from '@/utils/roles';

const auth = useAuthStore();
const router = useRouter();
const errors = useFormErrors();
const loading = ref(false);

const form = reactive({
  accountType: 'household',
  name: '',
  email: '',
  phone: '',
  password: '',
  businessName: '',
  businessType: '',
  address: '',
});
const isUmkm = computed(() => form.accountType === 'umkm');

const types = [
  { value: 'household', label: 'Rumah Tangga', desc: 'Setor jelantah dapur rumah', icon: House },
  { value: 'umkm', label: 'UMKM Kuliner', desc: 'Warung, kafe, katering', icon: Store },
];

function validate() {
  errors.clear();
  if (form.name.trim().length < 2) errors.set('name', 'Nama minimal 2 karakter');
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.set('email', 'Format email tidak valid');
  if (form.phone.trim() && !/^\+?[0-9]{8,15}$/.test(form.phone.trim())) errors.set('phone', 'Nomor telepon tidak valid (8-15 digit)');
  if (form.password.length < 8) errors.set('password', 'Password minimal 8 karakter');
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.set('password', 'Password harus mengandung huruf dan angka');
  if (isUmkm.value && form.businessName.trim().length < 2) errors.set('businessName', 'Nama usaha wajib diisi (minimal 2 karakter)');
  return !errors.hasErrors();
}

function buildPayload() {
  const payload = {
    accountType: form.accountType,
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
  };
  if (form.phone.trim()) payload.phone = form.phone.trim();
  if (isUmkm.value) {
    payload.businessName = form.businessName.trim();
    if (form.businessType.trim()) payload.businessType = form.businessType.trim();
    if (form.address.trim()) payload.address = form.address.trim();
  }
  return payload;
}

async function submit() {
  if (!validate()) return;
  loading.value = true;
  try {
    const user = await auth.register(buildPayload());
    await router.replace(roleHome(user.role));
  } catch (err) {
    errors.fromApiError(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container-page flex justify-center py-10 sm:py-16">
    <div class="w-full max-w-lg">
      <h1 class="text-3xl font-extrabold">Buat akun JelantahKu</h1>
      <p class="mt-2 text-muted">Sudah punya akun? <RouterLink to="/masuk" class="font-semibold text-brand-800 underline underline-offset-4">Masuk</RouterLink></p>

      <div class="card mt-6 p-6">
        <AppAlert v-if="errors.general.value" tone="error" class="mb-4">{{ errors.general.value }}</AppAlert>

        <form class="space-y-5" novalidate @submit.prevent="submit">
          <fieldset>
            <legend class="mb-2 text-sm font-semibold">Saya mendaftar sebagai</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="t in types"
                :key="t.value"
                class="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors duration-150 has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-700"
                :class="form.accountType === t.value ? 'border-brand-700 bg-brand-50' : 'border-field bg-card hover:border-brand-700'"
              >
                <input v-model="form.accountType" type="radio" name="accountType" :value="t.value" class="sr-only" />
                <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800"><component :is="t.icon" class="size-5" aria-hidden="true" /></span>
                <span><span class="block font-semibold">{{ t.label }}</span><span class="block text-sm text-muted">{{ t.desc }}</span></span>
              </label>
            </div>
          </fieldset>

          <AppInput v-model="form.name" label="Nama lengkap" autocomplete="name" :error="errors.fields.name" @update:model-value="errors.clear('name')" />
          <AppInput v-model="form.email" label="Email" type="email" autocomplete="email" inputmode="email" :error="errors.fields.email" @update:model-value="errors.clear('email')" />
          <AppInput v-model="form.phone" label="Nomor telepon / WhatsApp" optional type="tel" autocomplete="tel" inputmode="tel" hint="Dipakai kurir untuk menghubungi Anda saat penjemputan." :error="errors.fields.phone" @update:model-value="errors.clear('phone')" />
          <AppInput v-model="form.password" label="Password" type="password" autocomplete="new-password" hint="Minimal 8 karakter, mengandung huruf dan angka." :error="errors.fields.password" @update:model-value="errors.clear('password')" />

          <template v-if="isUmkm">
            <hr class="border-line" />
            <AppInput v-model="form.businessName" label="Nama usaha" autocomplete="organization" :error="errors.fields.businessName" @update:model-value="errors.clear('businessName')" />
            <AppInput v-model="form.businessType" label="Jenis usaha" optional placeholder="Contoh: warung makan, kafe, katering" />
            <AppInput v-model="form.address" label="Alamat usaha" optional autocomplete="street-address" />
          </template>

          <AppButton type="submit" block size="lg" :loading="loading">Buat akun</AppButton>
        </form>
      </div>
    </div>
  </section>
</template>
